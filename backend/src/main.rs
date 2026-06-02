mod models;
mod routes;
mod state;

use std::net::SocketAddr;

use axum::Router;
use tower_http::{cors::CorsLayer, services::ServeDir, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::state::AppState;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "crm_backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let state = AppState::connect()
        .await
        .expect("no se pudo conectar a PostgreSQL; revisa DATABASE_URL o postgres://postgres:1234@localhost:5433/CRM");
    let frontend = ServeDir::new("../frontend/dist").fallback(ServeDir::new("../frontend/dist"));
    let app = Router::new()
        .nest("/api", routes::router())
        .fallback_service(frontend)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("CRM disponible en http://{addr}");
    println!("API disponible en http://{addr}/api/health");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("no se pudo abrir el puerto 8080");
    axum::serve(listener, app)
        .await
        .expect("error en el servidor");
}
