pub mod user_proto {
    tonic::include_proto!("user");
}

use user_proto::user_service_client::UserServiceClient;
use user_proto::{GetUsersRequest, UpdateLastReadRequest, User};
use tonic::transport::Channel;

#[derive(Clone)]
pub struct GrpcClient {
    client: UserServiceClient<Channel>,
}

impl GrpcClient {
    pub async fn new(endpoint: String) -> Result<Self, Box<dyn std::error::Error>> {
        let client = UserServiceClient::connect(endpoint).await?;
        Ok(Self { client })
    }

    pub async fn get_users(&self, user_ids: Vec<String>) -> Result<std::collections::HashMap<String, User>, Box<dyn std::error::Error>> {
        let mut client = self.client.clone();
        let request = tonic::Request::new(GetUsersRequest { user_ids });
        let response = client.get_users(request).await?;
        Ok(response.into_inner().users)
    }

    pub async fn update_last_read(&self, user_id: String) -> Result<(), Box<dyn std::error::Error>> {
        let mut client = self.client.clone();
        let request = tonic::Request::new(UpdateLastReadRequest { user_id });
        client.update_last_read(request).await?;
        Ok(())
    }
}
