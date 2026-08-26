use aws_sdk_s3::{
    config::{Credentials, Region},
    primitives::ByteStream,
    Client,
};
use std::env;
use uuid::Uuid;
use crate::infrastructure::errors::AppError;

#[derive(Clone)]
pub struct StorageService {
    s3_client: Client,
    bucket_name: String,
    /// Base URL yang dipakai untuk membentuk link publik gambar. Harus dapat
    /// diakses BROWSER — beda dari endpoint internal S3 (di Docker `minio:9000`
    /// tidak resolve dari host). Diatur lewat `MINIO_PUBLIC_URL`.
    public_base_url: String,
}

impl StorageService {
    pub async fn new() -> Self {
        let endpoint = env::var("MINIO_ENDPOINT").unwrap_or_else(|_| "localhost".to_string());
        let port = env::var("MINIO_PORT").unwrap_or_else(|_| "9000".to_string());
        let use_ssl = env::var("MINIO_USE_SSL").unwrap_or_else(|_| "false".to_string()) == "true";
        let access_key = env::var("MINIO_ACCESS_KEY").expect("MINIO_ACCESS_KEY must be set");
        let secret_key = env::var("MINIO_SECRET_KEY").expect("MINIO_SECRET_KEY must be set");
        let bucket_name = env::var("MINIO_BUCKET").expect("MINIO_BUCKET must be set");

        let protocol = if use_ssl { "https" } else { "http" };
        let url = format!("{}://{}:{}", protocol, endpoint, port);

        let credentials = Credentials::new(
            access_key,
            secret_key,
            None,
            None,
            "minio",
        );

        let config = aws_sdk_s3::config::Builder::new()
            .region(Region::new("us-east-1")) // MinIO usually ignores this, but it's required by SDK
            .endpoint_url(&url)
            .credentials_provider(credentials)
            .force_path_style(true) // Required for MinIO
            .build();

        let s3_client = Client::from_conf(config);

        // Fallback ke endpoint internal agar perilaku lama tetap jalan bila
        // MINIO_PUBLIC_URL belum diisi.
        let public_base_url = env::var("MINIO_PUBLIC_URL")
            .unwrap_or_else(|_| url.clone())
            .trim_end_matches('/')
            .to_string();

        Self {
            s3_client,
            bucket_name,
            public_base_url,
        }
    }

    pub async fn upload_image(&self, file_name: &str, content_type: &str, data: Vec<u8>) -> Result<String, AppError> {
        let extension = std::path::Path::new(file_name)
            .extension()
            .and_then(std::ffi::OsStr::to_str)
            .unwrap_or("png");

        let unique_filename = format!("{}.{}", Uuid::new_v4(), extension);
        
        // Define path in bucket
        let key = format!("chat-images/{}", unique_filename);

        let _ = self
            .s3_client
            .put_object()
            .bucket(&self.bucket_name)
            .key(&key)
            .body(ByteStream::from(data))
            .content_type(content_type)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("Failed to upload to object storage: {:?}", e);
                AppError::InternalServerError
            })?;

        Ok(format!("{}/{}/{}", self.public_base_url, self.bucket_name, key))
    }
}
