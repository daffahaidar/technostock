use deadpool_lapin::{Config, Pool, Runtime};
use lapin::{
    options::{BasicPublishOptions, ExchangeDeclareOptions, QueueBindOptions, QueueDeclareOptions},
    types::FieldTable,
    BasicProperties, ExchangeKind,
};

use crate::infrastructure::errors::AppError;

pub struct RabbitMqService {
    pool: Pool,
}

impl RabbitMqService {
    pub async fn new(
        host: &str,
        port: u16,
        user: &str,
        pass: &str,
    ) -> Result<Self, AppError> {
        let url = format!("amqp://{}:{}@{}:{}/%2f", user, pass, host, port);
        let mut cfg = Config::default();
        cfg.url = Some(url);
        
        let pool = cfg
            .create_pool(Some(Runtime::Tokio1))
            .map_err(|e| {
                tracing::error!("Failed to create RabbitMQ pool: {:?}", e);
                AppError::InternalServerError
            })?;

        let service = Self { pool };
        
        service.setup_exchange_and_queues().await?;

        Ok(service)
    }

    async fn setup_exchange_and_queues(&self) -> Result<(), AppError> {
        let conn = self.pool.get().await.map_err(|e| {
            tracing::error!("Failed to get RabbitMQ connection from pool: {:?}", e);
            AppError::InternalServerError
        })?;
        let channel = conn.create_channel().await.map_err(|e| {
            tracing::error!("Failed to create RabbitMQ channel: {:?}", e);
            AppError::InternalServerError
        })?;

        // Declare Exchange
        channel
            .exchange_declare(
                "chat.events",
                ExchangeKind::Topic,
                ExchangeDeclareOptions {
                    durable: true,
                    ..Default::default()
                },
                FieldTable::default(),
            )
            .await
            .map_err(|e| {
                tracing::error!("Failed to declare RabbitMQ exchange: {:?}", e);
                AppError::InternalServerError
            })?;

        // We bind all our background worker queues to 'chat.message.created'
        // (If later we emit specific events, we can bind to chat.message.* or specific keys)
        let queues = vec![
            ("notification_queue", "chat.message.created"),
            ("analytics_queue", "chat.message.created"),
            ("moderation_queue", "chat.message.created"),
        ];

        for (queue_name, routing_key) in queues {
            channel
                .queue_declare(
                    queue_name,
                    QueueDeclareOptions {
                        durable: true,
                        ..Default::default()
                    },
                    FieldTable::default(),
                )
                .await
                .map_err(|e| {
                    tracing::error!("Failed to declare queue {}: {:?}", queue_name, e);
                    AppError::InternalServerError
                })?;

            channel
                .queue_bind(
                    queue_name,
                    "chat.events",
                    routing_key,
                    QueueBindOptions::default(),
                    FieldTable::default(),
                )
                .await
                .map_err(|e| {
                    tracing::error!("Failed to bind queue {} to routing key {}: {:?}", queue_name, routing_key, e);
                    AppError::InternalServerError
                })?;
        }

        tracing::info!("RabbitMQ exchanges and queues successfully declared and bound.");

        Ok(())
    }

    pub async fn publish_event(
        &self,
        routing_key: &str,
        payload: &str,
    ) -> Result<(), AppError> {
        let conn = self.pool.get().await.map_err(|e| {
            tracing::error!("Failed to get RabbitMQ connection from pool: {:?}", e);
            AppError::InternalServerError
        })?;
        
        let channel = conn.create_channel().await.map_err(|e| {
            tracing::error!("Failed to create RabbitMQ channel: {:?}", e);
            AppError::InternalServerError
        })?;

        channel
            .basic_publish(
                "chat.events",
                routing_key,
                BasicPublishOptions::default(),
                payload.as_bytes(),
                BasicProperties::default().with_delivery_mode(2), // Persistent Message
            )
            .await
            .map_err(|e| {
                tracing::error!("Failed to publish RabbitMQ message: {:?}", e);
                AppError::InternalServerError
            })?
            .await
            .map_err(|e| {
                tracing::error!("Failed to get valid confirmation from RabbitMQ: {:?}", e);
                AppError::InternalServerError
            })?;

        Ok(())
    }

    pub fn get_pool(&self) -> Pool {
        self.pool.clone()
    }
}
