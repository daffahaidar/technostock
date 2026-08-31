use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "PascalCase")]
/// Urut dari wewenang tertinggi ke terendah. `Owner` bertugas menyetujui
/// tindakan Admin (fiturnya belum ada), jadi untuk sekarang wewenangnya sama
/// dengan `Admin` di semua pengecekan.
pub enum Role {
    Maintainer,
    Owner,
    Admin,
    Member,
    User,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "varchar")]
pub enum UserStatus {
    Active,
    Suspended,
}

impl Default for UserStatus {
    fn default() -> Self {
        UserStatus::Active
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub phone: Option<String>,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: Option<String>,
    pub role: Role,
    pub status: UserStatus,
    pub github_id: Option<i64>,
    pub google_id: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub last_read_at: Option<DateTime<Utc>>,
    pub discord_username: Option<String>,
}
