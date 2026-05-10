use deadpool_lapin::Pool;
use futures_util::stream::StreamExt;
use lapin::{options::BasicAckOptions, options::BasicConsumeOptions, types::FieldTable};

pub async fn start_analytics_worker(pool: Pool) {
    tokio::spawn(async move {
        loop {
            if let Ok(conn) = pool.get().await {
                if let Ok(channel) = conn.create_channel().await {
                    tracing::info!("Analytics worker connected to RabbitMQ");

                    if let Ok(mut consumer) = channel
                        .basic_consume(
                            "analytics_queue",
                            "analytics_worker_consumer",
                            BasicConsumeOptions::default(),
                            FieldTable::default(),
                        )
                        .await
                    {
                        while let Some(delivery) = consumer.next().await {
                            if let Ok(delivery) = delivery {
                                if let Ok(payload) = String::from_utf8(delivery.data.clone()) {
                                    tracing::info!("Analytics processing message: {}", payload);
                                    
                                    // Simulated heavy workflow (e.g. updating metrics in DB)
                                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                                    
                                    // Acknowledge the message to remove it from the durable queue
                                    let _ = delivery.ack(BasicAckOptions::default()).await;
                                }
                            }
                        }
                    }
                }
            }
            
            tracing::warn!("Analytics worker lost connection to RabbitMQ, reconnecting in 5s...");
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
        }
    });
}
