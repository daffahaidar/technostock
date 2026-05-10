use sqlx::PgPool;
use uuid::Uuid;
use async_trait::async_trait;
use thiserror::Error;

use crate::domain::entities::message::Message;

#[derive(Error, Debug)]
pub enum MessageRepositoryError {
    #[error("Database error {0}")]
    Database(#[from] sqlx::Error),
    #[error("Not authorized to perform this action")]
    Unauthorized,
    #[error("Message not found")]
    NotFound,
}

// Struct to hold reactions before injecting user names from gRPC
#[derive(Clone)]
pub struct RawReactionSummary {
    pub emoji: String,
    pub count: i64,
    pub user_ids: Vec<Uuid>,
}

#[async_trait]
pub trait MessageRepository: Send + Sync {
    async fn create(&self, sender_id: Uuid, content: &str, reply_to_id: Option<Uuid>, image_url: Option<String>) -> Result<Message, MessageRepositoryError>;
    async fn get_message_by_id(&self, message_id: Uuid) -> Result<Option<Message>, MessageRepositoryError>;
    async fn get_recent_history(&self, cursor: Option<Uuid>, limit: i64) -> Result<Vec<Message>, MessageRepositoryError>;
    async fn toggle_reaction(&self, message_id: Uuid, user_id: Uuid, emoji: &str) -> Result<Vec<RawReactionSummary>, MessageRepositoryError>;
    async fn edit_message(&self, message_id: Uuid, sender_id: Uuid, new_content: &str) -> Result<Message, MessageRepositoryError>;
    async fn delete_message(&self, message_id: Uuid, sender_id: Uuid) -> Result<(), MessageRepositoryError>;
    async fn get_unread_count(&self, current_user_id: Uuid, last_read_at: chrono::DateTime<chrono::Utc>) -> Result<i64, MessageRepositoryError>;
    async fn get_reactions_by_message_ids(&self, message_ids: &[Uuid]) -> Result<std::collections::HashMap<Uuid, Vec<RawReactionSummary>>, MessageRepositoryError>;
}

pub struct PostgresMessageRepository {
    pool: PgPool,
}

impl PostgresMessageRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl MessageRepository for PostgresMessageRepository {
    async fn create(&self, sender_id: Uuid, content: &str, reply_to_id: Option<Uuid>, image_url: Option<String>) -> Result<Message, MessageRepositoryError> {
        let message = sqlx::query_as!(
            Message,
            r#"
            INSERT INTO message.messages (sender_id, content, reply_to_id, image_url) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, sender_id, content, created_at, reply_to_id, image_url, is_edited
            "#,
            sender_id,
            content,
            reply_to_id,
            image_url
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(message)
    }

    async fn get_message_by_id(&self, message_id: Uuid) -> Result<Option<Message>, MessageRepositoryError> {
        let message = sqlx::query_as!(
            Message,
            r#"
            SELECT id, sender_id, content, created_at, reply_to_id, image_url, is_edited
            FROM message.messages WHERE id = $1
            "#,
            message_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(message)
    }

    async fn get_recent_history(&self, cursor: Option<Uuid>, limit: i64) -> Result<Vec<Message>, MessageRepositoryError> {
        let messages = sqlx::query_as!(
            Message,
            r#"
            SELECT id, sender_id, content, created_at, reply_to_id, image_url, is_edited
            FROM message.messages
            WHERE ($1::uuid IS NULL OR created_at < (SELECT created_at FROM message.messages WHERE id = $1))
            ORDER BY created_at DESC
            LIMIT $2
            "#,
            cursor,
            limit
        )
        .fetch_all(&self.pool)
        .await?;

        let mut ordered_messages = messages;
        ordered_messages.reverse();
        Ok(ordered_messages)
    }

    async fn get_reactions_by_message_ids(&self, message_ids: &[Uuid]) -> Result<std::collections::HashMap<Uuid, Vec<RawReactionSummary>>, MessageRepositoryError> {
        let mut map = std::collections::HashMap::new();
        if message_ids.is_empty() { return Ok(map); }

        let rows = sqlx::query!(
            r#"
            SELECT message_id, emoji, COUNT(user_id) as "count!", array_agg(user_id) as "user_ids!"
            FROM message.message_reactions
            WHERE message_id = ANY($1)
            GROUP BY message_id, emoji
            "#,
            message_ids
        )
        .fetch_all(&self.pool)
        .await?;

        for row in rows {
            map.entry(row.message_id).or_insert_with(Vec::new).push(RawReactionSummary {
                emoji: row.emoji,
                count: row.count,
                user_ids: row.user_ids,
            });
        }
        Ok(map)
    }

    async fn toggle_reaction(&self, message_id: Uuid, user_id: Uuid, emoji: &str) -> Result<Vec<RawReactionSummary>, MessageRepositoryError> {
        let result = sqlx::query!(
            r#"
            DELETE FROM message.message_reactions 
            WHERE message_id = $1 AND user_id = $2 AND emoji = $3
            "#,
            message_id, user_id, emoji
        )
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            sqlx::query!(
                r#"
                INSERT INTO message.message_reactions (id, message_id, user_id, emoji)
                VALUES ($1, $2, $3, $4)
                "#,
                Uuid::new_v4(), message_id, user_id, emoji
            )
            .execute(&self.pool)
            .await?;
        }

        let map = self.get_reactions_by_message_ids(&[message_id]).await?;
        Ok(map.into_iter().next().map(|(_, v)| v).unwrap_or_default())
    }

    async fn edit_message(&self, message_id: Uuid, sender_id: Uuid, new_content: &str) -> Result<Message, MessageRepositoryError> {
        let result = sqlx::query_as!(
            Message,
            r#"
            UPDATE message.messages 
            SET content = $1, is_edited = TRUE 
            WHERE id = $2 AND sender_id = $3
            RETURNING id, sender_id, content, created_at, reply_to_id, image_url, is_edited
            "#,
            new_content, message_id, sender_id
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(msg) = result {
            Ok(msg)
        } else {
            let exists = sqlx::query!("SELECT id FROM message.messages WHERE id = $1", message_id)
                .fetch_optional(&self.pool)
                .await?;
            if exists.is_some() {
                Err(MessageRepositoryError::Unauthorized)
            } else {
                Err(MessageRepositoryError::NotFound)
            }
        }
    }

    async fn delete_message(&self, message_id: Uuid, sender_id: Uuid) -> Result<(), MessageRepositoryError> {
        let result = sqlx::query!(
            r#"
            DELETE FROM message.messages 
            WHERE id = $1 AND sender_id = $2
            "#,
            message_id, sender_id
        )
        .execute(&self.pool)
        .await?;

        if result.rows_affected() == 0 {
            let exists = sqlx::query!("SELECT id FROM message.messages WHERE id = $1", message_id)
                .fetch_optional(&self.pool)
                .await?;
            if exists.is_some() {
                return Err(MessageRepositoryError::Unauthorized);
            } else {
                return Err(MessageRepositoryError::NotFound);
            }
        }

        Ok(())
    }

    async fn get_unread_count(&self, current_user_id: Uuid, last_read_at: chrono::DateTime<chrono::Utc>) -> Result<i64, MessageRepositoryError> {
        let (count,): (Option<i64>,) = sqlx::query_as(
            r#"
            SELECT COUNT(*) 
            FROM message.messages 
            WHERE created_at > $1 AND sender_id != $2
            "#
        )
        .bind(last_read_at)
        .bind(current_user_id)
        .fetch_one(&self.pool)
        .await?;
        
        Ok(count.unwrap_or(0))
    }
}
