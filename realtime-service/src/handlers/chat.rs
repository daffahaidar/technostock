use axum::{
    extract::{State, WebSocketUpgrade, ws::{WebSocket, Message as WsMessage}, Query},
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use axum_typed_multipart::{TypedMultipart, TryFromMultipart};

use crate::AppState;
use crate::infrastructure::errors::AppError;
use crate::infrastructure::auth::middleware::AuthUser;
use crate::infrastructure::repositories::postgres_message_repository::MessageRepository;

use crate::domain::entities::message::{Message, MessageWithSender};
use crate::domain::entities::message_reaction::ReactionSummary;

#[derive(Deserialize, Serialize)]
#[serde(tag = "event_type")]
pub enum IncomingMessage {
    #[serde(rename = "message")]
    Message { content: String, reply_to_id: Option<uuid::Uuid>, image_url: Option<String> },
    #[serde(rename = "typing")]
    Typing,
    #[serde(rename = "react")]
    React { message_id: uuid::Uuid, emoji: String },
    #[serde(rename = "edit")]
    Edit { message_id: uuid::Uuid, content: String },
    #[serde(rename = "delete")]
    Delete { message_id: uuid::Uuid },
}

#[derive(Deserialize)]
pub struct GetChatHistoryQuery {
    pub cursor: Option<uuid::Uuid>,
    pub limit: Option<i64>,
}

async fn enrich_messages(state: &AppState, messages: Vec<Message>, current_user_id: uuid::Uuid) -> Result<Vec<MessageWithSender>, AppError> {
    if messages.is_empty() { return Ok(vec![]); }

    let mut user_ids: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut message_ids: Vec<uuid::Uuid> = Vec::new();

    for msg in &messages {
        user_ids.insert(msg.sender_id.to_string());
        message_ids.push(msg.id);
    }

    // Attempt to batch fetch replied messages
    let mut replied_messages = HashMap::new();
    for msg in &messages {
        if let Some(reply_to) = msg.reply_to_id {
            if let Ok(Some(replied)) = state.message_repository.get_message_by_id(reply_to).await {
                user_ids.insert(replied.sender_id.to_string());
                replied_messages.insert(reply_to, replied);
            }
        }
    }

    let users = state.grpc_client.get_users(user_ids.into_iter().collect()).await.unwrap_or_default();
    let reactions_map = state.message_repository.get_reactions_by_message_ids(&message_ids).await.unwrap_or_default();

    let mut enriched = Vec::new();
    for msg in messages {
        let sender = users.get(&msg.sender_id.to_string());
        
        let (replied_content, replied_sender_name) = if let Some(reply_to) = msg.reply_to_id {
            if let Some(r_msg) = replied_messages.get(&reply_to) {
                let r_sender = users.get(&r_msg.sender_id.to_string());
                (Some(r_msg.content.clone()), r_sender.map(|u| u.name.clone()))
            } else {
                (None, None)
            }
        } else {
            (None, None)
        };

        let raw_reactions = reactions_map.get(&msg.id).cloned().unwrap_or_default();
        let mut reactions = Vec::new();
        for rr in raw_reactions {
            let mut has_reacted = false;
            let mut user_names = Vec::new();
            for uid in rr.user_ids.iter().take(5) {
                if *uid == current_user_id { has_reacted = true; }
                if let Some(u) = users.get(&uid.to_string()) {
                    user_names.push(u.name.clone());
                }
            }
            if rr.user_ids.iter().any(|u| *u == current_user_id) { has_reacted = true; }
            reactions.push(ReactionSummary {
                emoji: rr.emoji.clone(),
                count: rr.count,
                user_names,
                has_reacted,
            });
        }

        // Parse role enum (we sent as debug format string like "User" or "Admin" over gRPC)
        let sender_role = if let Some(s) = sender {
            if s.role == "Admin" { crate::domain::entities::user::Role::Admin }
            else if s.role == "Maintainer" { crate::domain::entities::user::Role::Maintainer }
            else if s.role == "Member" { crate::domain::entities::user::Role::Member }
            else { crate::domain::entities::user::Role::User }
        } else { 
            crate::domain::entities::user::Role::User 
        };

        enriched.push(MessageWithSender {
            id: msg.id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            reply_to_id: msg.reply_to_id,
            replied_message_content: replied_content,
            replied_sender_name,
            sender_name: sender.map(|u| u.name.clone()).unwrap_or_else(|| "Unknown".to_string()),
            sender_role,
            sender_avatar_url: sender.and_then(|u| u.avatar_url.clone()),
            reactions,
            image_url: msg.image_url,
            is_edited: msg.is_edited,
        });
    }

    Ok(enriched)
}

pub async fn get_chat_history(
    State(state): State<AppState>,
    Query(params): Query<GetChatHistoryQuery>,
    auth_user: AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let limit = params.limit.unwrap_or(20);
    let messages = state.message_repository.get_recent_history(params.cursor, limit).await
        .map_err(|_| AppError::InternalServerError)?;

    let history = enrich_messages(&state, messages, auth_user.claims.claims.sub).await?;

    Ok(crate::utils::response::success_response_all(history))
}

#[derive(TryFromMultipart)]
pub struct UploadImageRequest {
    #[form_data(limit = "10MiB")]
    pub file: axum_typed_multipart::FieldData<axum::body::Bytes>,
}

pub async fn upload_image(
    State(state): State<AppState>,
    _auth_user: AuthUser,
    TypedMultipart(UploadImageRequest { file }): TypedMultipart<UploadImageRequest>,
) -> Result<impl IntoResponse, AppError> {
    let content_type = file.metadata.content_type.clone().unwrap_or_else(|| "application/octet-stream".to_string());
    let file_name = file.metadata.file_name.clone().unwrap_or_else(|| "image.png".to_string());
    let data = file.contents.to_vec();

    let image_url = state.storage_service.upload_image(&file_name, &content_type, data).await?;

    #[derive(Serialize)]
    struct UploadResponse {
        image_url: String,
    }

    Ok(crate::utils::response::success_response_one(UploadResponse { image_url }))
}

#[derive(Serialize)]
pub struct UnreadCountResponse {
    pub count: i64,
}

pub async fn get_unread_count(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.claims.claims.sub;
    
    let users = state.grpc_client.get_users(vec![user_id.to_string()]).await.unwrap_or_default();
    let user = users.get(&user_id.to_string()).ok_or_else(|| AppError::UserNotFound)?;
        
    let last_read_at = user.last_read_at
        .map(|ts| chrono::DateTime::from_timestamp_millis(ts).unwrap_or_else(|| chrono::Utc::now() - chrono::Duration::days(365)))
        .unwrap_or_else(|| chrono::Utc::now() - chrono::Duration::days(365));

    let count = state.message_repository.get_unread_count(user_id, last_read_at).await
        .map_err(|_| AppError::InternalServerError)?;

    Ok(crate::utils::response::success_response_one(UnreadCountResponse { count }))
}

pub async fn mark_as_read(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let user_id = auth_user.claims.claims.sub;

    state.grpc_client.update_last_read(user_id.to_string()).await
        .map_err(|_| AppError::InternalServerError)?;

    Ok(crate::utils::response::success_response((), "marked as read"))
}

pub async fn chat_ws_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let token = params.get("token").ok_or_else(|| AppError::InvalidToken)?;
    let group_id = params.get("group_id").cloned().unwrap_or_else(|| "general".to_string());
    
    // Verify token since browsers don't send auth headers automatically in WS constructor
    let claims = state.jwt_service.verify_token(token)
        .map_err(|_| AppError::InvalidToken)?;
        
    let user_id = claims.claims.sub;
    
    let users = state.grpc_client.get_users(vec![user_id.to_string()]).await.unwrap_or_default();
    let user = users.get(&user_id.to_string()).cloned().ok_or_else(|| AppError::UserNotFound)?;

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, user_id, user.name.clone(), group_id)))
}

async fn handle_socket(socket: WebSocket, state: AppState, user_id: uuid::Uuid, user_name: String, group_id: String) {
    let (mut sender, mut receiver) = socket.split();
    
    // Subscribe to the local broadcast channel matching this group
    let mut rx = state.broadcaster.get_or_create_sender(&group_id).subscribe();

    // Add user to online presence in Redis
    let _ = state.redis_service.add_online_user(&group_id, user_id).await;
    
    let online_count = state.redis_service.get_online_count(&group_id).await.unwrap_or(1);
    
    let online_msg = crate::infrastructure::websocket::broadcaster::ServerMessage::OnlineUsersCount { count: online_count };
    let _ = state.redis_service.publish_message(&group_id, &serde_json::to_string(&online_msg).unwrap()).await;

    // Spawn a task to receive messages from the broadcast channel and send them to the client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json = serde_json::to_string(&msg).unwrap();
            if sender.send(WsMessage::Text(json.into())).await.is_err() {
                break;
            }
        }
    });

    // Handle messages coming from the client
    let state_clone = state.clone();
    let group_id_clone = group_id.clone();
    let user_name_clone = user_name.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(WsMessage::Text(text))) = receiver.next().await {
            if let Ok(payload) = serde_json::from_str::<IncomingMessage>(&text) {
                match payload {
                    IncomingMessage::Message { content, reply_to_id, image_url } => {
                        if let Ok(message) = state_clone.message_repository.create(user_id, &content, reply_to_id, image_url).await {
                            if let Ok(mut enriched) = enrich_messages(&state_clone, vec![message], user_id).await {
                                if let Some(rich_msg) = enriched.pop() {
                                    let server_msg = crate::infrastructure::websocket::broadcaster::ServerMessage::NewMessage(rich_msg);
                                    let server_msg_json = serde_json::to_string(&server_msg).unwrap();
                                    let _ = state_clone.redis_service.publish_message(&group_id_clone, &server_msg_json).await;
                                    let _ = state_clone.rabbitmq_service.publish_event("chat.message.created", &server_msg_json).await;
                                }
                            }
                        }
                    }
                    IncomingMessage::Typing => {
                        let _ = state_clone.redis_service.set_typing(&group_id_clone, user_id).await;
                        let server_msg = crate::infrastructure::websocket::broadcaster::ServerMessage::UserTyping {
                            user_id,
                            user_name: user_name_clone.clone(),
                        };
                        let _ = state_clone.redis_service.publish_message(&group_id_clone, &serde_json::to_string(&server_msg).unwrap()).await;
                    }
                    IncomingMessage::React { message_id, emoji } => {
                        if let Ok(raw_reactions) = state_clone.message_repository.toggle_reaction(message_id, user_id, &emoji).await {
                            // Collect user IDs for mapping
                            let mut user_ids = std::collections::HashSet::new();
                            for rr in &raw_reactions {
                                for uid in &rr.user_ids {
                                    user_ids.insert(uid.to_string());
                                }
                            }
                            let users = state_clone.grpc_client.get_users(user_ids.into_iter().collect()).await.unwrap_or_default();
                            
                            let mut reactions = Vec::new();
                            for rr in raw_reactions {
                                let mut user_names = Vec::new();
                                let mut has_reacted = false;
                                for uid in rr.user_ids.iter().take(5) {
                                    if *uid == user_id { has_reacted = true; }
                                    if let Some(u) = users.get(&uid.to_string()) {
                                        user_names.push(u.name.clone());
                                    }
                                }
                                if rr.user_ids.iter().any(|u| *u == user_id) { has_reacted = true; }
                                reactions.push(ReactionSummary {
                                    emoji: rr.emoji.clone(),
                                    count: rr.count,
                                    user_names,
                                    has_reacted,
                                });
                            }
                            
                            let server_msg = crate::infrastructure::websocket::broadcaster::ServerMessage::ReactionUpdate {
                                message_id,
                                reactions,
                            };
                            let _ = state_clone.redis_service.publish_message(&group_id_clone, &serde_json::to_string(&server_msg).unwrap()).await;
                        }
                    }
                    IncomingMessage::Edit { message_id, content } => {
                        if let Ok(updated_msg) = state_clone.message_repository.edit_message(message_id, user_id, &content).await {
                            if let Ok(mut enriched) = enrich_messages(&state_clone, vec![updated_msg], user_id).await {
                                if let Some(rich_msg) = enriched.pop() {
                                    let server_msg = crate::infrastructure::websocket::broadcaster::ServerMessage::MessageEdited(rich_msg);
                                    let _ = state_clone.redis_service.publish_message(&group_id_clone, &serde_json::to_string(&server_msg).unwrap()).await;
                                }
                            }
                        }
                    }
                    IncomingMessage::Delete { message_id } => {
                        if state_clone.message_repository.delete_message(message_id, user_id).await.is_ok() {
                            let server_msg = crate::infrastructure::websocket::broadcaster::ServerMessage::MessageDeleted { message_id };
                            let _ = state_clone.redis_service.publish_message(&group_id_clone, &serde_json::to_string(&server_msg).unwrap()).await;
                        }
                    }
                }
            }
        }
    });

    // If any one of the tasks run to completion, we abort the other.
    tokio::select! {
        _ = (&mut send_task) => {
            recv_task.abort();
        },
        _ = (&mut recv_task) => {
            send_task.abort();
            let _ = send_task.await;
        },
    };

    let _ = state.redis_service.remove_online_user(&group_id, user_id).await;
    let updated_count = state.redis_service.get_online_count(&group_id).await.unwrap_or(0);
    
    let online_msg = crate::infrastructure::websocket::broadcaster::ServerMessage::OnlineUsersCount { count: updated_count };
    let _ = state.redis_service.publish_message(&group_id, &serde_json::to_string(&online_msg).unwrap()).await;
}
