use std::sync::Arc;
use shared_core::domain::entities::user::Role;
use shared_core::domain::repositories::user_repository::UserRepository;
use shared_core::domain::dtos::UserResponseDto;
use shared_core::infrastructure::errors::AppError;

pub struct GetUsersUseCase<R: UserRepository> {
    user_repository: Arc<R>,
}

impl<R: UserRepository> GetUsersUseCase<R> {
    pub fn new(user_repository: Arc<R>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, role: Role) -> Result<Vec<UserResponseDto>, AppError> {
        // Authorize: Only Admin, SuperAdmin and Maintainer can get all users.
        // Forbidden (403), bukan InvalidToken (401) — tokennya sah, role-nya yang kurang.
        match role {
            Role::Admin | Role::SuperAdmin | Role::Maintainer => {}
            _ => return Err(AppError::Forbidden),
        }

        let users = self.user_repository.find_all().await?;

        let user_dtos = users.into_iter().map(|u| UserResponseDto {
            name: u.name,
            phone: u.phone,
            email: u.email,
            role: u.role,
            avatar_url: u.avatar_url,
        }).collect();

        Ok(user_dtos)
    }
}
