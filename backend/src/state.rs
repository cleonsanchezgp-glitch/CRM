use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};

use sqlx::{PgPool, postgres::PgPoolOptions};
use tokio::sync::RwLock;

use crate::auth::Jwks;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub sessions: Arc<RwLock<HashMap<String, String>>>,
    pub keycloak_jwks: Arc<RwLock<Option<CachedJwks>>>,
}

pub struct CachedJwks {
    pub jwks: Jwks,
    pub fetched_at: Instant,
    pub ttl: Duration,
}

impl AppState {
    pub async fn connect() -> Result<Self, sqlx::Error> {
        let database_url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:1234@localhost:5433/CRM".to_string());

        let db = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?;

        Ok(Self {
            db,
            sessions: Arc::new(RwLock::new(HashMap::new())),
            keycloak_jwks: Arc::new(RwLock::new(None)),
        })
    }
}
