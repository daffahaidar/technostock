use chrono::{Duration, Utc};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey, TokenData, Algorithm};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::infrastructure::errors::AppError;

use crate::domain::entities::user::{User, Role};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub role: Role,
    pub avatar_url: Option<String>,
    pub exp: usize,
    pub iat: usize,
    pub token_type: String, // "access" or "refresh"
    pub discord_username: Option<String>,
}

pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    pub fn new(private_key: String, public_key: String) -> Self {
        let encoding_key = EncodingKey::from_rsa_pem(private_key.as_bytes())
            .expect("Invalid JWT_PRIVATE_KEY");
        let decoding_key = DecodingKey::from_rsa_pem(public_key.as_bytes())
            .expect("Invalid JWT_PUBLIC_KEY");
        
        Self {
            encoding_key,
            decoding_key,
        }
    }

    pub fn generate_tokens(&self, user: &User) -> Result<(String, String), AppError> {
        let now = Utc::now();
        let iat = now.timestamp() as usize;

        // Access Token (15 minutes)
        let exp_access = (now + Duration::minutes(15)).timestamp() as usize;
        let access_claims = Claims {
            sub: user.id,
            name: user.name.clone(),
            email: user.email.clone(),
            phone: user.phone.clone(),
            role: user.role.clone(),
            avatar_url: user.avatar_url.clone(),
            exp: exp_access,
            iat,
            token_type: "access".to_string(),
            discord_username: user.discord_username.clone(),
        };
        let access_token = encode(
            &Header::new(Algorithm::RS256),
            &access_claims,
            &self.encoding_key,
        ).map_err(|_| AppError::TokenCreationError)?;

        // Refresh Token (7 days)
        let exp_refresh = (now + Duration::days(7)).timestamp() as usize;
        let refresh_claims = Claims {
            sub: user.id,
            name: user.name.clone(),
            email: user.email.clone(),
            phone: user.phone.clone(),
            role: user.role.clone(),
            avatar_url: user.avatar_url.clone(),
            exp: exp_refresh,
            iat,
            token_type: "refresh".to_string(),
            discord_username: user.discord_username.clone(),
        };
        let refresh_token = encode(
            &Header::new(Algorithm::RS256),
            &refresh_claims,
            &self.encoding_key,
        ).map_err(|_| AppError::TokenCreationError)?;

        Ok((access_token, refresh_token))
    }

    pub fn verify_token(&self, token: &str) -> Result<TokenData<Claims>, AppError> {
        let validation = Validation::new(Algorithm::RS256);
        decode::<Claims>(
            token,
            &self.decoding_key,
            &validation,
        ).map_err(|e| {
            tracing::error!("JWT Validation Error: {:?}", e);
            AppError::InvalidToken
        })
    }
}
