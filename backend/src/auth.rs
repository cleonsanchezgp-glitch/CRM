use aes::Aes256;
use axum::{http::HeaderMap, http::StatusCode};
use base64::{Engine, engine::general_purpose::STANDARD};
use cbc::cipher::{BlockDecryptMut, KeyIvInit, block_padding::Pkcs7};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{collections::HashMap, time::Duration};
use uuid::Uuid;

use crate::state::{AppState, CachedJwks};

type Aes256CbcDec = cbc::Decryptor<Aes256>;

#[derive(Clone, Deserialize)]
pub struct Jwks {
    keys: Vec<Jwk>,
}

#[derive(Clone, Deserialize)]
pub struct Jwk {
    kid: Option<String>,
    kty: String,
    n: Option<String>,
    e: Option<String>,
}

#[derive(Clone, Deserialize)]
#[allow(dead_code)]
struct KeycloakClaims {
    exp: usize,
    iss: String,
    sub: Option<String>,
    aud: Option<serde_json::Value>,
    azp: Option<String>,
    preferred_username: Option<String>,
    email: Option<String>,
    realm_access: Option<KeycloakRoles>,
    resource_access: Option<HashMap<String, KeycloakRoles>>,
}

#[derive(Clone, Deserialize)]
struct KeycloakRoles {
    roles: Vec<String>,
}

struct KeycloakConfig {
    issuers: Vec<String>,
    jwks_url: String,
    client_id: Option<String>,
    audience: Option<String>,
    required_role: Option<String>,
}

enum AuthMode {
    Local,
    Keycloak,
    Hybrid,
}

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

    match auth_mode() {
        AuthMode::Local => validate_local_session(state, token).await,
        AuthMode::Keycloak => validate_keycloak_token(state, token).await,
        AuthMode::Hybrid => match validate_local_session(state, token).await {
            Ok(usuario) => Ok(usuario),
            Err(_) => validate_keycloak_token(state, token).await,
        },
    }
}

pub async fn current_user(state: &AppState, headers: &HeaderMap) -> Result<String, StatusCode> {
    require_auth(state, headers).await
}

pub fn local_auth_enabled() -> bool {
    explicit_local_auth_enabled() && matches!(auth_mode(), AuthMode::Local | AuthMode::Hybrid)
}

async fn validate_local_session(state: &AppState, token: &str) -> Result<String, StatusCode> {
    if !explicit_local_auth_enabled() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    state
        .sessions
        .read()
        .await
        .get(token)
        .cloned()
        .ok_or(StatusCode::UNAUTHORIZED)
}

fn explicit_local_auth_enabled() -> bool {
    matches!(
        std::env::var("ALLOW_LOCAL_AUTH")
            .unwrap_or_else(|_| "false".to_string())
            .to_ascii_lowercase()
            .as_str(),
        "1" | "true" | "yes"
    )
}

async fn validate_keycloak_token(state: &AppState, token: &str) -> Result<String, StatusCode> {
    let config = keycloak_config().ok_or_else(|| reject_keycloak("falta KEYCLOAK_ISSUER"))?;
    let header = decode_header(token)
        .map_err(|error| reject_keycloak(&format!("cabecera JWT no valida: {error}")))?;
    if header.alg != Algorithm::RS256 {
        return Err(reject_keycloak(&format!(
            "algoritmo JWT no soportado: {:?}",
            header.alg
        )));
    }

    let kid = header
        .kid
        .ok_or_else(|| reject_keycloak("el token no incluye kid"))?;
    let jwk = get_jwk(state, &config, &kid).await?;
    if jwk.kty != "RSA" {
        return Err(reject_keycloak("la clave JWKS no es RSA"));
    }

    let decoding_key = DecodingKey::from_rsa_components(
        jwk.n
            .as_deref()
            .ok_or_else(|| reject_keycloak("la clave JWKS no incluye el modulo RSA"))?,
        jwk.e
            .as_deref()
            .ok_or_else(|| reject_keycloak("la clave JWKS no incluye el exponente RSA"))?,
    )
    .map_err(|error| reject_keycloak(&format!("clave RSA no valida: {error}")))?;

    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_issuer(
        &config
            .issuers
            .iter()
            .map(String::as_str)
            .collect::<Vec<_>>(),
    );
    if let Some(audience) = config.audience.as_deref() {
        validation.set_audience(&[audience]);
    } else {
        validation.validate_aud = false;
    }

    let claims = decode::<KeycloakClaims>(token, &decoding_key, &validation)
        .map_err(|error| reject_keycloak(&format!("claims JWT no validas: {error}")))?
        .claims;

    if let Some(client_id) = config.client_id.as_deref() {
        if !claims_matches_client(&claims, client_id) {
            return Err(reject_keycloak(&format!(
                "el token no corresponde al cliente esperado: {client_id}"
            )));
        }
    }

    if let Some(role) = config.required_role.as_deref() {
        if !claims_has_role(&claims, role) {
            eprintln!("keycloak token rechazado: falta el rol requerido {role}");
            return Err(StatusCode::FORBIDDEN);
        }
    }

    claims
        .preferred_username
        .or(claims.email)
        .or(claims.sub)
        .ok_or_else(|| reject_keycloak("el token no incluye una identidad de usuario"))
}

async fn get_jwk(state: &AppState, config: &KeycloakConfig, kid: &str) -> Result<Jwk, StatusCode> {
    if let Some(jwk) = cached_jwk(state, kid).await {
        return Ok(jwk);
    }

    let jwks = fetch_jwks(config).await?;
    {
        let mut cache = state.keycloak_jwks.write().await;
        *cache = Some(CachedJwks {
            jwks: jwks.clone(),
            fetched_at: std::time::Instant::now(),
            ttl: jwks_cache_ttl(),
        });
    }

    jwks.keys
        .into_iter()
        .find(|jwk| jwk.kid.as_deref() == Some(kid))
        .ok_or_else(|| reject_keycloak("no se encontro el kid del token en JWKS"))
}

async fn cached_jwk(state: &AppState, kid: &str) -> Option<Jwk> {
    let cache = state.keycloak_jwks.read().await;
    let cached = cache.as_ref()?;
    if cached.fetched_at.elapsed() > cached.ttl {
        return None;
    }
    cached
        .jwks
        .keys
        .iter()
        .find(|jwk| jwk.kid.as_deref() == Some(kid))
        .cloned()
}

async fn fetch_jwks(config: &KeycloakConfig) -> Result<Jwks, StatusCode> {
    reqwest::get(&config.jwks_url)
        .await
        .map_err(|error| {
            reject_keycloak(&format!(
                "no se pudo descargar JWKS desde {}: {error}",
                config.jwks_url
            ))
        })?
        .error_for_status()
        .map_err(|error| {
            reject_keycloak(&format!(
                "Keycloak rechazo la peticion JWKS en {}: {error}",
                config.jwks_url
            ))
        })?
        .json::<Jwks>()
        .await
        .map_err(|error| reject_keycloak(&format!("JWKS no tiene formato valido: {error}")))
}

fn auth_mode() -> AuthMode {
    match std::env::var("AUTH_MODE")
        .unwrap_or_else(|_| "keycloak".to_string())
        .to_ascii_lowercase()
        .as_str()
    {
        "keycloak" => AuthMode::Keycloak,
        "hybrid" => AuthMode::Hybrid,
        _ => AuthMode::Local,
    }
}

fn keycloak_config() -> Option<KeycloakConfig> {
    let issuer = std::env::var("KEYCLOAK_ISSUER").ok()?;
    let issuer = issuer.trim_end_matches('/').to_string();
    let mut issuers = vec![issuer.clone()];
    issuers.extend(localhost_issuer_aliases(&issuer));
    if let Some(extra_issuers) = non_empty_env("KEYCLOAK_ALLOWED_ISSUERS") {
        issuers.extend(
            extra_issuers
                .split(',')
                .map(|value| value.trim().trim_end_matches('/').to_string())
                .filter(|value| !value.is_empty()),
        );
        issuers.sort();
        issuers.dedup();
    }
    let jwks_url = std::env::var("KEYCLOAK_JWKS_URL")
        .unwrap_or_else(|_| format!("{issuer}/protocol/openid-connect/certs"));
    Some(KeycloakConfig {
        issuers,
        jwks_url,
        client_id: non_empty_env("KEYCLOAK_CLIENT_ID"),
        audience: non_empty_env("KEYCLOAK_AUDIENCE"),
        required_role: non_empty_env("KEYCLOAK_REQUIRED_ROLE").or_else(|| Some("crm_user".into())),
    })
}

fn reject_keycloak(reason: &str) -> StatusCode {
    eprintln!("keycloak token rechazado: {reason}");
    StatusCode::UNAUTHORIZED
}

fn localhost_issuer_aliases(issuer: &str) -> Vec<String> {
    let mut aliases = Vec::new();

    if issuer.contains("://127.0.0.1:") {
        aliases.push(issuer.replacen("://127.0.0.1:", "://localhost:", 1));
    }

    if issuer.contains("://localhost:") {
        aliases.push(issuer.replacen("://localhost:", "://127.0.0.1:", 1));
    }

    aliases
}

fn jwks_cache_ttl() -> Duration {
    let seconds = std::env::var("KEYCLOAK_JWKS_CACHE_SECONDS")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(300);
    Duration::from_secs(seconds)
}

fn non_empty_env(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn claims_matches_client(claims: &KeycloakClaims, client_id: &str) -> bool {
    if claims.azp.as_deref() == Some(client_id) {
        return true;
    }
    match claims.aud.as_ref() {
        Some(serde_json::Value::String(audience)) => audience == client_id,
        Some(serde_json::Value::Array(audiences)) => audiences
            .iter()
            .any(|audience| audience.as_str() == Some(client_id)),
        _ => false,
    }
}

fn claims_has_role(claims: &KeycloakClaims, required_role: &str) -> bool {
    let realm_match = claims
        .realm_access
        .as_ref()
        .is_some_and(|access| access.roles.iter().any(|role| role == required_role));

    let resource_match = claims.resource_access.as_ref().is_some_and(|clients| {
        clients
            .values()
            .any(|access| access.roles.iter().any(|role| role == required_role))
    });

    realm_match || resource_match
}

fn aes_key() -> [u8; 32] {
    let secret =
        std::env::var("CRM_AES_KEY").unwrap_or_else(|_| "crm-dev-aes-key-change-me".to_string());
    Sha256::digest(secret.as_bytes()).into()
}

#[cfg(test)]
mod tests {
    use super::localhost_issuer_aliases;

    #[test]
    fn adds_localhost_alias_for_loopback_issuer() {
        let aliases = localhost_issuer_aliases("http://127.0.0.1:8081/realms/crm");

        assert_eq!(aliases, vec!["http://localhost:8081/realms/crm"]);
    }

    #[test]
    fn adds_loopback_alias_for_localhost_issuer() {
        let aliases = localhost_issuer_aliases("http://localhost:8081/realms/crm");

        assert_eq!(aliases, vec!["http://127.0.0.1:8081/realms/crm"]);
    }
}
