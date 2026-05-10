use axum::{response::IntoResponse, Json};
use serde::Serialize;

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub meta: Meta,
    pub results: Option<T>,
}

#[derive(Serialize)]
pub struct Meta {
    pub status: String,
    pub message: String,
}

pub fn success_response<T: Serialize>(data: T, message: &str) -> impl IntoResponse {
    Json(ApiResponse {
        meta: Meta {
            status: "Success".to_string(),
            message: message.to_string(),
        },
        results: Some(data),
    })
}

pub fn success_response_all<T: Serialize>(data: T) -> impl IntoResponse {
    success_response(data, "Success Retrieve All Data")
}

pub fn success_response_one<T: Serialize>(data: T) -> impl IntoResponse {
    success_response(data, "Success Retrieve One Data")
}
