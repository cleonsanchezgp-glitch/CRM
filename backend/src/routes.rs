use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
};
use sqlx::{PgPool, Row};

use crate::{
    models::{ApiItem, Client, Contract, Dashboard, Incident, Invoice, Tag},
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .route("/dashboard", get(dashboard))
        .route("/clientes", get(clientes))
        .route("/clientes/{cif}", get(cliente_by_cif))
        .route("/posibles-clientes", get(posibles_clientes))
        .route("/apis/plantilla", get(apis_plantilla))
        .route("/apis/especificas", get(apis_especificas))
        .route("/facturas", get(facturas))
        .route("/contratos", get(contratos))
        .route("/incidencias", get(incidencias))
}

async fn health(State(state): State<AppState>) -> impl IntoResponse {
    match sqlx::query_scalar::<_, i64>("SELECT 1")
        .fetch_one(&state.db)
        .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(
                serde_json::json!({ "status": "ok", "service": "crm-backend", "database": "connected" }),
            ),
        ),
        Err(error) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({ "status": "error", "database": error.to_string() })),
        ),
    }
}

async fn dashboard(State(state): State<AppState>) -> Result<Json<Dashboard>, StatusCode> {
    Ok(Json(Dashboard {
        clientes: count(&state.db, "clientes").await?,
        posibles_clientes: count(&state.db, "posibles_clientes").await?,
        apis_plantilla: count(&state.db, "api_plantilla").await?,
        apis_especificas: count(&state.db, "api_especifica").await?,
        facturas_pendientes: count(&state.db, "facturas").await?,
    }))
}

async fn clientes(State(state): State<AppState>) -> Result<Json<Vec<Client>>, StatusCode> {
    Ok(Json(fetch_clients(&state.db, ClientKind::Cliente).await?))
}

async fn cliente_by_cif(
    State(state): State<AppState>,
    Path(cif): Path<String>,
) -> impl IntoResponse {
    match fetch_client_by_cif(&state.db, &cif).await {
        Ok(Some(client)) => (StatusCode::OK, Json(serde_json::json!(client))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "cliente no encontrado" })),
        ),
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "error consultando la base de datos" })),
        ),
    }
}

async fn posibles_clientes(State(state): State<AppState>) -> Result<Json<Vec<Client>>, StatusCode> {
    Ok(Json(
        fetch_clients(&state.db, ClientKind::PosibleCliente).await?,
    ))
}

async fn apis_plantilla(State(state): State<AppState>) -> Result<Json<Vec<ApiItem>>, StatusCode> {
    Ok(Json(fetch_apis(&state.db, ApiKind::Plantilla).await?))
}

async fn apis_especificas(State(state): State<AppState>) -> Result<Json<Vec<ApiItem>>, StatusCode> {
    Ok(Json(fetch_apis(&state.db, ApiKind::Especifica).await?))
}

async fn facturas(State(state): State<AppState>) -> Result<Json<Vec<Invoice>>, StatusCode> {
    let rows = sqlx::query(
        r#"
        SELECT id, nombre_empresa, COALESCE(url_factura, '') AS url_factura,
               coste_facturacion::float8 AS coste_facturacion, COALESCE(fecha, CURRENT_DATE) AS fecha, cif_cliente
        FROM facturas
        ORDER BY fecha DESC NULLS LAST, id DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(
        rows.into_iter()
            .map(|row| Invoice {
                id: row.get("id"),
                nombre_empresa: row.get("nombre_empresa"),
                url_factura: row.get("url_factura"),
                coste_facturacion: row.get("coste_facturacion"),
                fecha: row.get("fecha"),
                cif_cliente: row.get("cif_cliente"),
            })
            .collect(),
    ))
}

async fn contratos(State(state): State<AppState>) -> Result<Json<Vec<Contract>>, StatusCode> {
    let rows = sqlx::query(
        r#"
        SELECT id, nombre_empresa, COALESCE(url_contrato, '') AS url_contrato, COALESCE(fecha, CURRENT_DATE) AS fecha, cif_cliente
        FROM contratos
        ORDER BY fecha DESC NULLS LAST, id DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(
        rows.into_iter()
            .map(|row| Contract {
                id: row.get("id"),
                nombre_empresa: row.get("nombre_empresa"),
                url_contrato: row.get("url_contrato"),
                fecha: row.get("fecha"),
                cif_cliente: row.get("cif_cliente"),
            })
            .collect(),
    ))
}

async fn incidencias(State(state): State<AppState>) -> Result<Json<Vec<Incident>>, StatusCode> {
    let rows = sqlx::query(
        r#"
        SELECT id, nombre_empresa, titulo_incidencia,
               COALESCE(descripcion_incidencia, '') AS descripcion_incidencia,
               id_cliente
        FROM incidencias
        ORDER BY id
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(
        rows.into_iter()
            .map(|row| Incident {
                id: row.get("id"),
                nombre_empresa: row.get("nombre_empresa"),
                titulo_incidencia: row.get("titulo_incidencia"),
                descripcion_incidencia: row.get("descripcion_incidencia"),
                id_cliente: row.get("id_cliente"),
            })
            .collect(),
    ))
}

#[derive(Clone, Copy)]
enum ClientKind {
    Cliente,
    PosibleCliente,
}

#[derive(Clone, Copy)]
enum ApiKind {
    Plantilla,
    Especifica,
}

async fn count(pool: &PgPool, table: &str) -> Result<usize, StatusCode> {
    let sql = format!("SELECT COUNT(*)::bigint FROM {table}");
    let total = sqlx::query_scalar::<_, i64>(&sql)
        .fetch_one(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(total as usize)
}

async fn fetch_client_by_cif(pool: &PgPool, cif: &str) -> Result<Option<Client>, sqlx::Error> {
    let clients = fetch_clients(pool, ClientKind::Cliente)
        .await
        .map_err(|_| sqlx::Error::Protocol("no se pudo consultar clientes".to_string()))?;
    Ok(clients.into_iter().find(|client| client.cif == cif))
}

async fn fetch_clients(pool: &PgPool, kind: ClientKind) -> Result<Vec<Client>, StatusCode> {
    let rows = match kind {
        ClientKind::Cliente => {
            sqlx::query(
                r#"
                SELECT cif, nombre_empresa, COALESCE(telefono_contacto, '') AS telefono_contacto,
                       COALESCE(necesidades, '') AS necesidades,
                       COALESCE(direccion, '') AS direccion,
                       'Cliente activo' AS estado
                FROM clientes
                ORDER BY nombre_empresa
                "#,
            )
            .fetch_all(pool)
            .await
        }
        ClientKind::PosibleCliente => {
            sqlx::query(
                r#"
                SELECT cif, nombre_empresa, COALESCE(telefono_contacto, '') AS telefono_contacto,
                       COALESCE(necesidades, '') AS necesidades,
                       COALESCE(direccion, '') AS direccion,
                       COALESCE(estado, 'Sin estado') AS estado
                FROM posibles_clientes
                ORDER BY nombre_empresa
                "#,
            )
            .fetch_all(pool)
            .await
        }
    }
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut clients = Vec::new();
    for row in rows {
        let cif: String = row.get("cif");
        clients.push(Client {
            cif: cif.clone(),
            nombre_empresa: row.get("nombre_empresa"),
            telefono_contacto: row.get("telefono_contacto"),
            necesidades: row.get("necesidades"),
            direccion: row.get("direccion"),
            estado: row.get("estado"),
            tags: fetch_client_tags(pool, kind, &cif).await?,
            apis_plantilla: fetch_client_template_apis(pool, kind, &cif).await?,
            apis_especificas: match kind {
                ClientKind::Cliente => fetch_client_specific_apis(pool, &cif).await?,
                ClientKind::PosibleCliente => Vec::new(),
            },
        });
    }

    Ok(clients)
}

async fn fetch_apis(pool: &PgPool, kind: ApiKind) -> Result<Vec<ApiItem>, StatusCode> {
    let sql = match kind {
        ApiKind::Plantilla => {
            "SELECT id, nombre, COALESCE(descripcion, '') AS descripcion, COALESCE(url, '') AS url FROM api_plantilla ORDER BY nombre"
        }
        ApiKind::Especifica => {
            "SELECT id, nombre, COALESCE(descripcion, '') AS descripcion, COALESCE(url, '') AS url FROM api_especifica ORDER BY nombre"
        }
    };

    let rows = sqlx::query(sql)
        .fetch_all(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut apis = Vec::new();
    for row in rows {
        let id: String = row.get("id");
        apis.push(ApiItem {
            id: id.clone(),
            nombre: row.get("nombre"),
            descripcion: row.get("descripcion"),
            url: row.get("url"),
            tags: fetch_api_tags(pool, kind, &id).await?,
            clientes_relacionados: fetch_api_client_relations(pool, kind, &id).await?,
            posibles_clientes_relacionados: match kind {
                ApiKind::Plantilla => fetch_template_lead_relations(pool, &id).await?,
                ApiKind::Especifica => Vec::new(),
            },
        });
    }

    Ok(apis)
}

async fn fetch_client_tags(
    pool: &PgPool,
    kind: ClientKind,
    cif: &str,
) -> Result<Vec<Tag>, StatusCode> {
    let sql = match kind {
        ClientKind::Cliente => {
            "SELECT t.id, t.nombre, COALESCE(t.tipo, '') AS tipo, COALESCE(t.color, '') AS color FROM tags t JOIN clientes_tags ct ON ct.id_tag = t.id WHERE ct.id_cliente = $1 ORDER BY t.nombre"
        }
        ClientKind::PosibleCliente => {
            "SELECT t.id, t.nombre, COALESCE(t.tipo, '') AS tipo, COALESCE(t.color, '') AS color FROM tags t JOIN posibles_clientes_tags pct ON pct.id_tag = t.id WHERE pct.id_posible_cliente = $1 ORDER BY t.nombre"
        }
    };
    fetch_tags(pool, sql, cif).await
}

async fn fetch_api_tags(pool: &PgPool, kind: ApiKind, id: &str) -> Result<Vec<Tag>, StatusCode> {
    let sql = match kind {
        ApiKind::Plantilla => {
            "SELECT t.id, t.nombre, COALESCE(t.tipo, '') AS tipo, COALESCE(t.color, '') AS color FROM tags t JOIN apis_plantilla_tags apt ON apt.id_tag = t.id WHERE apt.id_api_plantilla = $1 ORDER BY t.nombre"
        }
        ApiKind::Especifica => {
            "SELECT t.id, t.nombre, COALESCE(t.tipo, '') AS tipo, COALESCE(t.color, '') AS color FROM tags t JOIN apis_especificas_tags aet ON aet.id_tag = t.id WHERE aet.id_api_especifica = $1 ORDER BY t.nombre"
        }
    };
    fetch_tags(pool, sql, id).await
}

async fn fetch_tags(pool: &PgPool, sql: &str, id: &str) -> Result<Vec<Tag>, StatusCode> {
    let rows = sqlx::query(sql)
        .bind(id)
        .fetch_all(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(rows
        .into_iter()
        .map(|row| Tag {
            id: row.get("id"),
            nombre: row.get("nombre"),
            tipo: row.get("tipo"),
            color: row.get("color"),
        })
        .collect())
}

async fn fetch_client_template_apis(
    pool: &PgPool,
    kind: ClientKind,
    cif: &str,
) -> Result<Vec<ApiItem>, StatusCode> {
    let sql = match kind {
        ClientKind::Cliente => {
            "SELECT ap.id, ap.nombre, COALESCE(ap.descripcion, '') AS descripcion, COALESCE(ap.url, '') AS url FROM api_plantilla ap JOIN clientes_apis_plantilla cap ON cap.id_api_plantilla = ap.id WHERE cap.cif_cliente = $1 ORDER BY ap.nombre"
        }
        ClientKind::PosibleCliente => {
            "SELECT ap.id, ap.nombre, COALESCE(ap.descripcion, '') AS descripcion, COALESCE(ap.url, '') AS url FROM api_plantilla ap JOIN posibles_clientes_apis_plantilla pcap ON pcap.id_api_plantilla = ap.id WHERE pcap.cif_posible_cliente = $1 ORDER BY ap.nombre"
        }
    };
    fetch_related_apis(pool, sql, ApiKind::Plantilla, cif).await
}

async fn fetch_client_specific_apis(pool: &PgPool, cif: &str) -> Result<Vec<ApiItem>, StatusCode> {
    fetch_related_apis(
        pool,
        "SELECT ae.id, ae.nombre, COALESCE(ae.descripcion, '') AS descripcion, COALESCE(ae.url, '') AS url FROM api_especifica ae JOIN clientes_apis_especificas cae ON cae.id_api_especifica = ae.id WHERE cae.cif_cliente = $1 ORDER BY ae.nombre",
        ApiKind::Especifica,
        cif,
    )
    .await
}

async fn fetch_related_apis(
    pool: &PgPool,
    sql: &str,
    kind: ApiKind,
    id: &str,
) -> Result<Vec<ApiItem>, StatusCode> {
    let rows = sqlx::query(sql)
        .bind(id)
        .fetch_all(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut apis = Vec::new();
    for row in rows {
        let api_id: String = row.get("id");
        apis.push(ApiItem {
            id: api_id.clone(),
            nombre: row.get("nombre"),
            descripcion: row.get("descripcion"),
            url: row.get("url"),
            tags: fetch_api_tags(pool, kind, &api_id).await?,
            clientes_relacionados: fetch_api_client_relations(pool, kind, &api_id).await?,
            posibles_clientes_relacionados: match kind {
                ApiKind::Plantilla => fetch_template_lead_relations(pool, &api_id).await?,
                ApiKind::Especifica => Vec::new(),
            },
        });
    }

    Ok(apis)
}

async fn fetch_api_client_relations(
    pool: &PgPool,
    kind: ApiKind,
    id: &str,
) -> Result<Vec<String>, StatusCode> {
    let sql = match kind {
        ApiKind::Plantilla => {
            "SELECT cif_cliente AS cif FROM clientes_apis_plantilla WHERE id_api_plantilla = $1 ORDER BY cif_cliente"
        }
        ApiKind::Especifica => {
            "SELECT cif_cliente AS cif FROM clientes_apis_especificas WHERE id_api_especifica = $1 ORDER BY cif_cliente"
        }
    };
    fetch_string_list(pool, sql, id, "cif").await
}

async fn fetch_template_lead_relations(pool: &PgPool, id: &str) -> Result<Vec<String>, StatusCode> {
    fetch_string_list(
        pool,
        "SELECT cif_posible_cliente AS cif FROM posibles_clientes_apis_plantilla WHERE id_api_plantilla = $1 ORDER BY cif_posible_cliente",
        id,
        "cif",
    )
    .await
}

async fn fetch_string_list(
    pool: &PgPool,
    sql: &str,
    id: &str,
    column: &str,
) -> Result<Vec<String>, StatusCode> {
    let rows = sqlx::query(sql)
        .bind(id)
        .fetch_all(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(rows.into_iter().map(|row| row.get(column)).collect())
}
