use redis::{aio::MultiplexedConnection, Client, AsyncCommands};
use uuid::Uuid;

#[derive(Clone)]
pub struct RedisService {
    pub client: Client,
    pub connection: MultiplexedConnection,
}

impl RedisService {
    pub async fn new(redis_url: &str) -> std::result::Result<Self, redis::RedisError> {
        let client = Client::open(redis_url)?;
        let connection = client.get_multiplexed_tokio_connection().await?;
        
        Ok(Self {
            client,
            connection,
        })
    }

    pub async fn publish_message(&self, group_id: &str, payload: &str) -> std::result::Result<(), redis::RedisError> {
        let mut conn = self.connection.clone();
        conn.publish(format!("chat:group:{}", group_id), payload).await
    }

    pub async fn add_online_user(&self, group_id: &str, user_id: Uuid) -> std::result::Result<(), redis::RedisError> {
        let mut conn = self.connection.clone();
        conn.sadd(format!("group:{}", group_id), user_id.to_string()).await
    }

    pub async fn remove_online_user(&self, group_id: &str, user_id: Uuid) -> std::result::Result<(), redis::RedisError> {
        let mut conn = self.connection.clone();
        conn.srem(format!("group:{}", group_id), user_id.to_string()).await
    }

    pub async fn get_online_count(&self, group_id: &str) -> std::result::Result<usize, redis::RedisError> {
        let mut conn = self.connection.clone();
        conn.scard(format!("group:{}", group_id)).await
    }

    pub async fn set_typing(&self, group_id: &str, user_id: Uuid) -> std::result::Result<(), redis::RedisError> {
        let mut conn = self.connection.clone();
        conn.set_ex(format!("typing:group:{}:{}", group_id, user_id), "1", 5).await
    }
}
