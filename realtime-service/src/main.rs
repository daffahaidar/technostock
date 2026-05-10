mod config;
mod domain;
mod handlers;
mod infrastructure;
mod routes;
mod utils;
mod workers;

use axum::http::Method;
use dotenvy::dotenv;
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use futures::stream::StreamExt;

use crate::infrastructure::auth::jwt::JwtService;
use crate::infrastructure::database::postgres::Database;
use crate::infrastructure::repositories::postgres_message_repository::PostgresMessageRepository;
use crate::infrastructure::websocket::broadcaster::{Broadcaster, ServerMessage};
use crate::infrastructure::storage_service::StorageService;
use crate::infrastructure::redis_service::RedisService;
use crate::infrastructure::rabbitmq_service::RabbitMqService;
use crate::infrastructure::grpc_client::GrpcClient;

#[derive(Clone)]
pub struct AppState {
    pub jwt_service: Arc<JwtService>,
    pub message_repository: Arc<PostgresMessageRepository>,
    pub broadcaster: Arc<Broadcaster>,
    pub storage_service: Arc<StorageService>,
    pub redis_service: Arc<RedisService>,
    pub rabbitmq_service: Arc<RabbitMqService>,
    pub grpc_client: Arc<GrpcClient>,
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "rust_axum=debug,tower_http=debug,sqlx=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let jwt_private_key = env::var("JWT_PRIVATE_KEY").expect("JWT_PRIVATE_KEY must be set").replace("\\n", "\n");
    let jwt_public_key = env::var("JWT_PUBLIC_KEY").expect("JWT_PUBLIC_KEY must be set").replace("\\n", "\n");
    let redis_host = env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string());
    let redis_port = env::var("REDIS_PORT").unwrap_or_else(|_| "6379".to_string());
    let redis_password = env::var("REDIS_PASSWORD").unwrap_or_else(|_| "".to_string());
    
    let rabbitmq_host = env::var("RABBITMQ_HOST").unwrap_or_else(|_| "localhost".to_string());
    let rabbitmq_port = env::var("RABBITMQ_PORT").unwrap_or_else(|_| "5672".to_string()).parse::<u16>().unwrap_or(5672);
    let rabbitmq_user = env::var("RABBITMQ_USER").unwrap_or_else(|_| "guest".to_string());
    let rabbitmq_pass = env::var("RABBITMQ_PASS").unwrap_or_else(|_| "guest".to_string());
    
    let redis_url = if redis_password.is_empty() {
        format!("redis://{}:{}", redis_host, redis_port)
    } else {
        format!("redis://:{}@{}:{}", redis_password, redis_host, redis_port)
    };

    let db = Database::new(&database_url).await.expect("Failed to connect to database");

    sqlx::migrate!("./migrations")
        .run(&db.pool)
        .await
        .expect("Failed to run migrations");

    let message_repository = Arc::new(PostgresMessageRepository::new(db.pool.clone()));
    let broadcaster = Arc::new(Broadcaster::new());
    let jwt_service = Arc::new(JwtService::new(jwt_private_key, jwt_public_key));
    let storage_service = Arc::new(StorageService::new().await);
    let redis_service = Arc::new(RedisService::new(&redis_url).await.expect("Failed to connect to Redis"));
    tracing::info!("Successfully connected to Redis at {}", redis_host);

    let rabbitmq_service = Arc::new(
        RabbitMqService::new(&rabbitmq_host, rabbitmq_port, &rabbitmq_user, &rabbitmq_pass)
            .await
            .expect("Failed to connect to RabbitMQ"),
    );
    tracing::info!("Successfully connected to RabbitMQ at {}", rabbitmq_host);

    let grpc_url = std::env::var("AUTH_GRPC_URL").unwrap_or_else(|_| "http://127.0.0.1:50051".to_string());
    let grpc_client = Arc::new(GrpcClient::new(grpc_url).await.expect("Failed to connect to GRPC"));

    // Start background workers
    let rmq_pool = rabbitmq_service.get_pool();
    crate::workers::notification_worker::start_notification_worker(rmq_pool.clone()).await;
    crate::workers::analytics_worker::start_analytics_worker(rmq_pool.clone()).await;
    crate::workers::moderation_worker::start_moderation_worker(rmq_pool.clone()).await;

    // Async task to listen for Redis Pub/Sub messages across all groups
    let pubsub_client = redis::Client::open(redis_url.clone()).expect("Failed to create Redis pubsub client");
    let broadcaster_clone = broadcaster.clone();
    tokio::spawn(async move {
        if let Ok(mut pubsub_conn) = pubsub_client.get_async_pubsub().await {
            if let Err(e) = pubsub_conn.psubscribe("chat:group:*").await {
                tracing::error!("Failed to psubscribe to Redis: {}", e);
                return;
            }

            let mut msg_stream = pubsub_conn.on_message();
            while let Some(msg) = msg_stream.next().await {
                let channel_name: String = msg.get_channel_name().to_string();
                if let Some(group_id) = channel_name.strip_prefix("chat:group:") {
                    if let Ok(payload) = msg.get_payload::<String>() {
                        if let Ok(server_msg) = serde_json::from_str::<ServerMessage>(&payload) {
                            let tx = broadcaster_clone.get_or_create_sender(group_id);
                            // We ignore send errors here, meaning there are no active web sockets for this group
                            let _ = tx.send(server_msg);
                        }
                    }
                }
            }
        } else {
            tracing::error!("Failed to obtain Redis async pubsub connection");
        }
    });

    let state = AppState {
        message_repository,
        broadcaster,
        jwt_service,
        storage_service,
        redis_service,
        rabbitmq_service,
        grpc_client,
    };


    let api_routes = routes::api::create_router();
    
    let app = axum::Router::new()
        .nest("/api/v1", api_routes)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let address = SocketAddr::from(([0, 0, 0, 0], 8001));
    tracing::info!("Server listening on {}", address);

    let listener = tokio::net::TcpListener::bind(address).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
