use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[allow(dead_code)]
pub struct MessageReaction {
    pub id: Uuid,
    pub message_id: Uuid,
    pub user_id: Uuid,
    pub emoji: String,
    pub created_at: Option<DateTime<Utc>>,
}

// Struct utilized mostly for UI representation of grouped reactions on a single message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReactionSummary {
    pub emoji: String,
    pub count: i64,
    pub user_names: Vec<String>, // Up to ~5 names to render inside a tooltip
    pub has_reacted: bool,       // Boolean indicating if the CURRENT user has reacted with this emoji
}
