use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

use super::user::Role;
use super::message_reaction::ReactionSummary;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub created_at: Option<DateTime<Utc>>,
    pub reply_to_id: Option<Uuid>,
    pub image_url: Option<String>,
    pub is_edited: bool,
}

// We also often need the sender's details alongside the message in the chat
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MessageWithSender {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub created_at: Option<DateTime<Utc>>,
    pub reply_to_id: Option<Uuid>,
    pub replied_message_content: Option<String>,
    pub replied_sender_name: Option<String>,
    // Sender details
    pub sender_name: String,
    pub sender_role: Role,
    pub sender_avatar_url: Option<String>,
    // Reactions
    #[sqlx(default)]
    pub reactions: Vec<ReactionSummary>,
    pub image_url: Option<String>,
    pub is_edited: bool,
}
