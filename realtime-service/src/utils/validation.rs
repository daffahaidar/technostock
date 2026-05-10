use validator::Validate;
use crate::infrastructure::errors::AppError;

#[allow(dead_code)]
pub fn validate_request<T: Validate>(payload: &T) -> Result<(), AppError> {
    payload
        .validate()
        .map_err(|e| AppError::ValidationError(e.to_string()))
}
