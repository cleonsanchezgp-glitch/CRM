use aes::Aes256;
use axum::{http::HeaderMap, http::StatusCode};
use base64::{Engine, engine::general_purpose::STANDARD};
use cbc::cipher::{BlockDecryptMut, KeyIvInit, block_padding::Pkcs7};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::state::AppState;

type Aes256CbcDec = cbc::Decryptor<Aes256>;

pub fn decrypt_password(encrypted: &str) -> Result<String, StatusCode> {
    let (iv_b64, cipher_b64) = encrypted
        .split_once(':')
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let iv = STANDARD
        .decode(iv_b64)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let ciphertext = STANDARD
        .decode(cipher_b64)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let key = aes_key();

    let plaintext = Aes256CbcDec::new_from_slices(&key, &iv)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .decrypt_padded_vec_mut::<Pkcs7>(&ciphertext)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    String::from_utf8(plaintext).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

pub async fn create_session(state: &AppState, usuario: &str) -> String {
    let token = Uuid::new_v4().to_string();
    state
        .sessions
        .write()
        .await
        .insert(token.clone(), usuario.to_string());
    token
}

pub async fn require_auth(state: &AppState, headers: &HeaderMap) -> Result<String, StatusCode> {
    let token = headers
        .get("authorization")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    state
        .sessions
        .read()
        .await
        .get(token)
        .cloned()
        .ok_or(StatusCode::UNAUTHORIZED)
}

fn aes_key() -> [u8; 32] {
    let secret =
        std::env::var("CRM_AES_KEY").unwrap_or_else(|_| "crm-dev-aes-key-change-me".to_string());
    Sha256::digest(secret.as_bytes()).into()
}
