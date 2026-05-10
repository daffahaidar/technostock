use axum::{
    routing::{post, get},
    Router,
};
use crate::handlers::chat::{get_chat_history, chat_ws_handler, upload_image, get_unread_count, mark_as_read};
use crate::AppState;

pub fn create_router() -> Router<AppState> {
    Router::new()
        .route("/chat/history", get(get_chat_history))
        .route("/chat/upload", post(upload_image))
        .route("/chat/unread-count", get(get_unread_count))
        .route("/chat/read", post(mark_as_read))
        .route("/chat/ws", get(chat_ws_handler))
}
