mod server;

use dotenvy::dotenv;
use std::env;
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use shared_core::infrastructure::auth::jwt::JwtService;
use shared_core::infrastructure::database::postgres::Database;
use shared_core::infrastructure::repositories::postgres_user_repository::PostgresUserRepository;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "grpc_service=debug,sqlx=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let jwt_private_key = env::var("JWT_PRIVATE_KEY").expect("JWT_PRIVATE_KEY must be set").replace("\\n", "\n");
    let jwt_public_key = env::var("JWT_PUBLIC_KEY").expect("JWT_PUBLIC_KEY must be set").replace("\\n", "\n");

    let db = Database::new(&database_url).await.expect("Failed to connect to database");
    


    let user_repository = Arc::new(PostgresUserRepository::new(db.pool.clone()));
    let jwt_service = Arc::new(JwtService::new(jwt_private_key, jwt_public_key));

    let addr = "0.0.0.0:50051".parse().unwrap();
    let user_service = server::user_service_impl::UserServiceImpl {
        user_repository,
        jwt_service,
    };

    tracing::info!("gRPC Server listening on {}", addr);
    
    tonic::transport::Server::builder()
        .add_service(server::user_service_impl::user_proto::user_service_server::UserServiceServer::new(user_service))
        .serve(addr)
        .await?;

    Ok(())
}
