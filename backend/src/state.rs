use std::{collections::HashMap, sync::Arc};

use sqlx::{PgPool, postgres::PgPoolOptions};
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub sessions: Arc<RwLock<HashMap<String, String>>>,
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
        })
    }
}
