use axum::{
    body::Body,
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Request, State,
    },
    http::StatusCode,
    response::Response,
    routing::{any, get},
    Router,
};
use futures_util::{SinkExt, StreamExt};
use reqwest::Client;
use std::env;
use tokio_tungstenite::connect_async;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
struct AppState {
    client: Client,
    auth_service_url: String,
    main_service_url: String,
    realtime_service_ws_url: String,
}

pub async fn start_gateway() {
    let auth_service_url =
        env::var("AUTH_SERVICE_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let main_service_url =
        env::var("MAIN_SERVICE_URL").unwrap_or_else(|_| "http://localhost:8002".to_string());
    let realtime_service_ws_url =
        env::var("REALTIME_SERVICE_WS_URL").unwrap_or_else(|_| "ws://localhost:8001".to_string());

    let state = AppState {
        client: Client::new(),
        auth_service_url,
        main_service_url,
        realtime_service_ws_url,
    };

    let app = Router::new()
        .route("/api/v1/auth", any(proxy_auth))
        .route("/api/v1/auth/{*path}", any(proxy_auth))
        .route("/api/v1/main", any(proxy_main))
        .route("/api/v1/main/{*path}", any(proxy_main))
        .route("/ws", get(proxy_ws))
        .route("/ws/{*path}", get(proxy_ws))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    tracing::info!("API Gateway listening on 0.0.0.0:8080");
    axum::serve(listener, app).await.unwrap();
}

async fn proxy_auth(
    State(state): State<AppState>,
    req: Request<Body>,
) -> Result<Response<Body>, StatusCode> {
    let path = req.uri().path();
    let path_query = req
        .uri()
        .path_and_query()
        .map(|v| v.as_str())
        .unwrap_or(path);

    let uri = format!("{}{}", state.auth_service_url, path_query);
    proxy_request(state.client, req, uri).await
}

async fn proxy_main(
    State(state): State<AppState>,
    req: Request<Body>,
) -> Result<Response<Body>, StatusCode> {
    let path = req.uri().path();
    let path_query = req
        .uri()
        .path_and_query()
        .map(|v| v.as_str())
        .unwrap_or(path);

    // Strip /api/v1/main and replace with /api/v1
    let stripped_path = if path_query.starts_with("/api/v1/main") {
        path_query.replacen("/api/v1/main", "/api/v1", 1)
    } else {
        path_query.to_string()
    };

    let uri = format!("{}{}", state.main_service_url, stripped_path);
    proxy_request(state.client, req, uri).await
}

async fn proxy_request(
    client: Client,
    req: Request<Body>,
    uri: String,
) -> Result<Response<Body>, StatusCode> {
    let (parts, body) = req.into_parts();
    let reqwest_body = reqwest::Body::wrap_stream(body.into_data_stream());

    let mut request_builder = client.request(parts.method, &uri);
    for (name, value) in parts.headers.iter() {
        if name != axum::http::header::HOST {
            request_builder = request_builder.header(name.clone(), value.clone());
        }
    }

    let request_builder = request_builder.body(reqwest_body);

    let res = request_builder.send().await.map_err(|e| {
        tracing::error!("Proxy error to {}: {}", uri, e);
        StatusCode::BAD_GATEWAY
    })?;

    let mut response_builder = Response::builder().status(res.status());
    for (name, value) in res.headers().iter() {
        response_builder = response_builder.header(name.clone(), value.clone());
    }

    let stream = res.bytes_stream();
    let axum_body = Body::from_stream(stream);

    Ok(response_builder.body(axum_body).unwrap())
}

async fn proxy_ws(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    req: Request<Body>,
) -> Response<Body> {
    let path = req.uri().path();
    let path_query = req
        .uri()
        .path_and_query()
        .map(|v| v.as_str())
        .unwrap_or(path);

    let ws_url = format!("{}{}", state.realtime_service_ws_url, path_query);

    ws.on_upgrade(move |socket| handle_ws(socket, ws_url))
}

async fn handle_ws(client_ws: WebSocket, target_url: String) {
    let Ok((server_ws, _)) = connect_async(&target_url).await else {
        tracing::error!("Failed to connect to backend WS at {}", target_url);
        return;
    };

    let (mut client_tx, mut client_rx) = client_ws.split();
    let (mut server_tx, mut server_rx) = server_ws.split();

    let client_to_server = tokio::spawn(async move {
        while let Some(Ok(msg)) = client_rx.next().await {
            let backend_msg = match msg {
                Message::Text(t) => {
                    tokio_tungstenite::tungstenite::Message::Text(t.as_str().into())
                }
                Message::Binary(b) => tokio_tungstenite::tungstenite::Message::Binary(b.into()),
                Message::Ping(p) => tokio_tungstenite::tungstenite::Message::Ping(p.into()),
                Message::Pong(p) => tokio_tungstenite::tungstenite::Message::Pong(p.into()),
                Message::Close(c) => {
                    let close_frame = c.map(|cf| tokio_tungstenite::tungstenite::protocol::CloseFrame {
                        code: tokio_tungstenite::tungstenite::protocol::frame::coding::CloseCode::from(cf.code),
                        reason: cf.reason.as_str().into(),
                    });
                    tokio_tungstenite::tungstenite::Message::Close(close_frame)
                }
            };
            if server_tx.send(backend_msg).await.is_err() {
                break;
            }
        }
    });

    let server_to_client = tokio::spawn(async move {
        while let Some(Ok(msg)) = server_rx.next().await {
            let client_msg = match msg {
                tokio_tungstenite::tungstenite::Message::Text(t) => {
                    Message::Text(t.as_str().into())
                }
                tokio_tungstenite::tungstenite::Message::Binary(b) => Message::Binary(b.into()),
                tokio_tungstenite::tungstenite::Message::Ping(p) => Message::Ping(p.into()),
                tokio_tungstenite::tungstenite::Message::Pong(p) => Message::Pong(p.into()),
                tokio_tungstenite::tungstenite::Message::Close(c) => {
                    let close_frame = c.map(|cf| axum::extract::ws::CloseFrame {
                        code: cf.code.into(),
                        reason: cf.reason.as_str().into(),
                    });
                    Message::Close(close_frame)
                }
                tokio_tungstenite::tungstenite::Message::Frame(_) => continue,
            };
            if client_tx.send(client_msg).await.is_err() {
                break;
            }
        }
    });

    tokio::select! {
        _ = client_to_server => {}
        _ = server_to_client => {}
    }
}
