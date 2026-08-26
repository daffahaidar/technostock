use std::sync::Arc;
use uuid::Uuid;
use shared_core::domain::entities::user::{User, Role, UserStatus};
use shared_core::domain::repositories::user_repository::UserRepository;
use shared_core::domain::dtos::{CreateUserDto, UpdateUserDto, UpdateUserStatusDto, UserResponseDto};
use crate::infrastructure::auth::password::hash_password;
use shared_core::infrastructure::errors::AppError;

/// Create User Use Case - Admin + Maintainer only
pub struct CreateUserUseCase<R: UserRepository> {
    user_repository: Arc<R>,
}

impl<R: UserRepository> CreateUserUseCase<R> {
    pub fn new(user_repository: Arc<R>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, requester_role: Role, dto: CreateUserDto) -> Result<UserResponseDto, AppError> {
        // Check permissions: Only Admin and Maintainer can create users
        match requester_role {
            Role::Admin | Role::SuperAdmin | Role::Maintainer => {},
            _ => return Err(AppError::Forbidden),
        }

        let password_hash = hash_password(&dto.password)?;

        let user = User {
            id: Uuid::new_v4(),
            name: dto.name,
            phone: dto.phone,
            email: dto.email,
            password_hash: Some(password_hash),
            role: dto.role,
            status: UserStatus::default(),
            github_id: None,
            google_id: None,
            avatar_url: None,
            created_at: None,
            updated_at: None,
            last_read_at: None,
            discord_username: None,
        };

        let created_user = self.user_repository.create(&user).await?;

        Ok(UserResponseDto {
            name: created_user.name,
            phone: created_user.phone,
            email: created_user.email,
            role: created_user.role,
            avatar_url: created_user.avatar_url,
        })
    }
}

/// Update User Use Case - Maintainer only
pub struct UpdateUserUseCase<R: UserRepository> {
    user_repository: Arc<R>,
}

impl<R: UserRepository> UpdateUserUseCase<R> {
    pub fn new(user_repository: Arc<R>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, requester_role: Role, user_id: Uuid, dto: UpdateUserDto) -> Result<UserResponseDto, AppError> {
        // Check permissions: Only Maintainer can update users
        if requester_role != Role::Maintainer {
            return Err(AppError::Forbidden);
        }

        // Fetch existing user
        let mut user = self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or(AppError::UserNotFound)?;

        // Update fields if provided
        if let Some(name) = dto.name {
            user.name = name;
        }
        if let Some(phone) = dto.phone {
            user.phone = Some(phone);
        }
        if let Some(email) = dto.email {
            user.email = email;
        }
        if let Some(role) = dto.role {
            user.role = role;
        }

        let updated_user = self.user_repository.update(user_id, &user).await?;

        Ok(UserResponseDto {
            name: updated_user.name,
            phone: updated_user.phone,
            email: updated_user.email,
            role: updated_user.role,
            avatar_url: updated_user.avatar_url,
        })
    }
}

/// Delete User Use Case - Maintainer only, cannot delete self
pub struct DeleteUserUseCase<R: UserRepository> {
    user_repository: Arc<R>,
}

impl<R: UserRepository> DeleteUserUseCase<R> {
    pub fn new(user_repository: Arc<R>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, requester_id: Uuid, requester_role: Role, user_id: Uuid) -> Result<(), AppError> {
        // Check permissions: Only Maintainer can delete users
        if requester_role != Role::Maintainer {
            return Err(AppError::Forbidden);
        }

        // Prevent self-deletion
        if requester_id == user_id {
            return Err(AppError::CannotDeleteSelf);
        }

        // Verify user exists before deleting
        self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or(AppError::UserNotFound)?;

        self.user_repository.delete(user_id).await?;

        Ok(())
    }
}

/// Suspend/Activate User Use Case - Admin + Maintainer
pub struct UpdateUserStatusUseCase<R: UserRepository> {
    user_repository: Arc<R>,
}

impl<R: UserRepository> UpdateUserStatusUseCase<R> {
    pub fn new(user_repository: Arc<R>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, requester_role: Role, user_id: Uuid, dto: UpdateUserStatusDto) -> Result<UserResponseDto, AppError> {
        // Check permissions: Admin and Maintainer can suspend users
        match requester_role {
            Role::Admin | Role::SuperAdmin | Role::Maintainer => {},
            _ => return Err(AppError::Forbidden),
        }

        // Cek keberadaan user dulu: tanpa ini `update_status` memakai `fetch_one`,
        // sehingga user yang tidak ada menghasilkan RowNotFound -> 500, bukan 404.
        if self.user_repository.find_by_id(user_id).await?.is_none() {
            return Err(AppError::UserNotFound);
        }

        let updated_user = self.user_repository.update_status(user_id, dto.status).await?;

        Ok(UserResponseDto {
            name: updated_user.name,
            phone: updated_user.phone,
            email: updated_user.email,
            role: updated_user.role,
            avatar_url: updated_user.avatar_url,
        })
    }
}
