mod auth;
mod models;
mod routes;
mod state;

use std::net::SocketAddr;

use axum::Router;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::state::AppState;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "crm_backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let state = AppState::connect()
        .await
        .expect("no se pudo conectar a PostgreSQL; revisa DATABASE_URL");
    if let Err(error) = routes::ensure_status_tags(&state.db).await {
        eprintln!("no se pudieron sembrar las etiquetas de estado de proyecto: {error}");
    }
    let app = Router::new()
        .nest("/api", routes::router())
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let host = std::env::var("BACKEND_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(8080);
    let addr: SocketAddr = format!("{host}:{port}")
        .parse()
        .expect("BACKEND_HOST/BACKEND_PORT no forman una direccion valida");

    println!("API disponible en http://{addr}/api/health");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("no se pudo abrir el puerto del backend");
    axum::serve(listener, app)
        .await
        .expect("error en el servidor");
}
