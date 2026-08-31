use tonic::{Request, Response, Status};
use std::sync::Arc;

pub mod user_proto {
    // The string specified here must match the proto package name
    tonic::include_proto!("user"); 
}

use user_proto::user_service_server::UserService;
use user_proto::{GetUsersRequest, GetUsersResponse, GetAllUsersRequest, UpdateLastReadRequest, ValidateTokenRequest, ValidateTokenResponse, Empty, User};
use shared_core::infrastructure::repositories::postgres_user_repository::PostgresUserRepository;
use shared_core::domain::repositories::user_repository::UserRepository;
use shared_core::infrastructure::auth::jwt::JwtService;

pub struct UserServiceImpl {
    pub user_repository: Arc<PostgresUserRepository>,
    pub jwt_service: Arc<JwtService>,
}

#[tonic::async_trait]
impl UserService for UserServiceImpl {
    async fn get_users(
        &self,
        request: Request<GetUsersRequest>,
    ) -> Result<Response<GetUsersResponse>, Status> {
        let user_ids: Vec<uuid::Uuid> = request
            .into_inner()
            .user_ids
            .into_iter()
            .filter_map(|id| uuid::Uuid::parse_str(&id).ok())
            .collect();

        let mut users = std::collections::HashMap::new();
        
        for id in user_ids {
            if let Ok(Some(user)) = self.user_repository.find_by_id(id).await {
                users.insert(id.to_string(), User {
                    id: user.id.to_string(),
                    name: user.name,
                    role: format!("{:?}", user.role),
                    avatar_url: user.avatar_url,
                    last_read_at: user.last_read_at.map(|ts| ts.timestamp_millis()),
                    discord_username: user.discord_username,
                    email: user.email,
                    status: format!("{:?}", user.status),
                });
            }
        }

        Ok(Response::new(GetUsersResponse { users }))
    }

    async fn get_all_users(
        &self,
        request: Request<GetAllUsersRequest>,
    ) -> Result<Response<GetUsersResponse>, Status> {
        let exclude_roles: Vec<String> = request.into_inner().exclude_roles;
        
        let all_users = self.user_repository.find_all().await
            .map_err(|_| Status::internal("Failed to fetch users"))?;

        let mut users = std::collections::HashMap::new();
        for user in all_users {
            let role_str = format!("{:?}", user.role);
            if !exclude_roles.contains(&role_str) {
                users.insert(user.id.to_string(), User {
                    id: user.id.to_string(),
                    name: user.name,
                    role: role_str,
                    avatar_url: user.avatar_url,
                    last_read_at: user.last_read_at.map(|ts| ts.timestamp_millis()),
                    discord_username: user.discord_username,
                    email: user.email,
                    status: format!("{:?}", user.status),
                });
            }
        }

        Ok(Response::new(GetUsersResponse { users }))
    }

    async fn update_last_read(
        &self,
        request: Request<UpdateLastReadRequest>,
    ) -> Result<Response<Empty>, Status> {
        let req = request.into_inner();
        let user_id = uuid::Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user_id format"))?;

        self.user_repository.update_last_read_at(user_id).await
            .map_err(|_| Status::internal("Failed to update last_read_at"))?;

        Ok(Response::new(Empty {}))
    }

    async fn validate_token(
        &self,
        request: Request<ValidateTokenRequest>,
    ) -> Result<Response<ValidateTokenResponse>, Status> {
        let token = request.into_inner().token;

        match self.jwt_service.verify_token(&token) {
            Ok(token_data) => {
                // Ensure it is an access token
                if token_data.claims.token_type != "access" {
                    return Ok(Response::new(ValidateTokenResponse {
                        is_valid: false,
                        user_id: "".to_string(),
                        role: "".to_string(),
                        error_message: "Invalid token type".to_string(),
                    }));
                }

                Ok(Response::new(ValidateTokenResponse {
                    is_valid: true,
                    user_id: token_data.claims.sub.to_string(),
                    role: format!("{:?}", token_data.claims.role),
                    error_message: "".to_string(),
                }))
            }
            Err(e) => {
                Ok(Response::new(ValidateTokenResponse {
                    is_valid: false,
                    user_id: "".to_string(),
                    role: "".to_string(),
                    error_message: format!("Token validation failed: {:?}", e),
                }))
            }
        }
    }

    async fn update_user_role(
        &self,
        request: Request<crate::server::user_service_impl::user_proto::UpdateUserRoleRequest>,
    ) -> Result<Response<Empty>, Status> {
        let req = request.into_inner();
        let user_id = uuid::Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user_id format"))?;

        // Nilai harus persis sama dengan hasil `format!("{:?}", Role)` yang dikirim
        // RPC lain. Role tak dikenal DITOLAK — dulu jatuh ke `Role::User`, yang
        // membuat typo mendowngrade user tanpa error apa pun.
        let role = match req.role.as_str() {
            "Member" => shared_core::domain::entities::user::Role::Member,
            "Admin" => shared_core::domain::entities::user::Role::Admin,
            "Owner" => shared_core::domain::entities::user::Role::Owner,
            "Maintainer" => shared_core::domain::entities::user::Role::Maintainer,
            "User" => shared_core::domain::entities::user::Role::User,
            other => {
                return Err(Status::invalid_argument(format!(
                    "Unknown role '{}'. Expected one of: Maintainer, Owner, Admin, Member, User",
                    other
                )))
            }
        };

        self.user_repository.update_role(user_id, role).await
            .map_err(|_| Status::internal("Failed to update user role"))?;

        Ok(Response::new(Empty {}))
    }

    async fn update_discord_username(
        &self,
        request: Request<crate::server::user_service_impl::user_proto::UpdateDiscordUsernameRequest>,
    ) -> Result<Response<Empty>, Status> {
        let req = request.into_inner();
        let user_id = uuid::Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user_id format"))?;

        self.user_repository.update_discord_username(user_id, req.discord_username).await
            .map_err(|_| Status::internal("Failed to update discord username"))?;

        Ok(Response::new(Empty {}))
    }
}
