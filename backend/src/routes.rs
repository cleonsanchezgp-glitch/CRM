use axum::{
    Json, Router,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
};
use chrono::NaiveDate;
use sqlx::{PgPool, Row};

use crate::{
    auth::{create_session, decrypt_password, require_auth},
    models::{
        ApiItem, Client, Contract, CreateApiRequest, CreateClientRequest, CreateInvoiceRequest,
        CreateLeadRequest, Dashboard, GitHubFileItem, GitHubFilesRequest, Incident, Invoice,
        LoginRequest, LoginResponse, Tag, TagMutationRequest,
    },
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .route("/auth/login", post(login))
        .route("/dashboard", get(dashboard))
        .route("/clientes", get(clientes).post(create_cliente))
        .route("/clientes/{cif}", get(cliente_by_cif))
        .route(
            "/posibles-clientes",
            get(posibles_clientes).post(create_posible_cliente),
        )
        .route(
            "/apis/plantilla",
            get(apis_plantilla).post(create_api_plantilla),
        )
        .route(
            "/apis/especificas",
            get(apis_especificas).post(create_api_especifica),
        )
        .route("/facturas", get(facturas).post(create_factura))
        .route("/contratos", get(contratos))
        .route("/incidencias", get(incidencias))
        .route("/github/repository-files", post(github_repository_files))
        .route("/tags", get(tags))
        .route("/tags/add", post(add_tag))
        .route("/tags/remove", post(remove_tag))
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let row = sqlx::query("SELECT usuario, contrasenya, rol FROM usuarios WHERE usuario = $1")
        .bind(&payload.usuario)
        .fetch_optional(&state.db)
        .await;

    let Some(row) = (match row {
        Ok(row) => row,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "error consultando usuario" })),
            );
        }
    }) else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "usuario o contrasenya incorrectos" })),
        );
    };

    let encrypted_password: String = row.get("contrasenya");
    let Ok(password) = decrypt_password(&encrypted_password) else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "usuario o contrasenya incorrectos" })),
        );
    };

    if password != payload.contrasenya {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "usuario o contrasenya incorrectos" })),
        );
    }

    let usuario: String = row.get("usuario");
    let rol: String = row.get("rol");
    let token = create_session(&state, &usuario).await;

    (
        StatusCode::OK,
        Json(serde_json::json!(LoginResponse {
            token,
            usuario,
            rol,
        })),
    )
}

async fn health(State(state): State<AppState>) -> impl IntoResponse {
    match sqlx::query_scalar::<_, i64>("SELECT 1::bigint")
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

async fn dashboard(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Dashboard>, StatusCode> {
    require_auth(&state, &headers).await?;
    Ok(Json(Dashboard {
        clientes: count(&state.db, "clientes").await?,
        posibles_clientes: count(&state.db, "posibles_clientes").await?,
        apis_plantilla: count(&state.db, "api_plantilla").await?,
        apis_especificas: count(&state.db, "api_especifica").await?,
        facturas_pendientes: count(&state.db, "facturas").await?,
    }))
}

async fn clientes(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Client>>, StatusCode> {
    require_auth(&state, &headers).await?;
    Ok(Json(fetch_clients(&state.db, ClientKind::Cliente).await?))
}

async fn create_cliente(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateClientRequest>,
) -> impl IntoResponse {
    if require_auth(&state, &headers).await.is_err() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "no autorizado" })),
        );
    }

    let cif = payload.cif.trim();
    let nombre_empresa = payload.nombre_empresa.trim();
    if cif.is_empty() || nombre_empresa.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "CIF y nombre de empresa son obligatorios" })),
        );
    }

    let result = sqlx::query(
        r#"
        INSERT INTO clientes (
            cif, nombre_empresa, telefono_contacto, necesidades, direccion, url_archivos_adjuntos
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING cif
        "#,
    )
    .bind(cif)
    .bind(nombre_empresa)
    .bind(optional_trim(payload.telefono_contacto))
    .bind(optional_trim(payload.necesidades))
    .bind(optional_trim(payload.direccion))
    .bind(optional_trim(payload.url_archivos_adjuntos))
    .fetch_one(&state.db)
    .await;

    let row = match result {
        Ok(row) => row,
        Err(error) => {
            if let Some(db_error) = error.as_database_error() {
                if db_error.is_unique_violation() {
                    return (
                        StatusCode::CONFLICT,
                        Json(serde_json::json!({ "error": "Ya existe un cliente con ese CIF" })),
                    );
                }
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(
                        serde_json::json!({ "error": format!("No se pudo crear el cliente: {}", db_error.message()) }),
                    ),
                );
            }
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(
                    serde_json::json!({ "error": format!("No se pudo crear el cliente: {error}") }),
                ),
            );
        }
    };

    let created_cif: String = row.get("cif");
    match fetch_client_by_cif(&state.db, &created_cif).await {
        Ok(Some(client)) => (StatusCode::CREATED, Json(serde_json::json!(client))),
        _ => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "Cliente creado, pero no se pudo recuperar" })),
        ),
    }
}

async fn cliente_by_cif(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(cif): Path<String>,
) -> impl IntoResponse {
    if require_auth(&state, &headers).await.is_err() {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "no autorizado" })),
        );
    }
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

async fn posibles_clientes(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Client>>, StatusCode> {
    require_auth(&state, &headers).await?;
    Ok(Json(
        fetch_clients(&state.db, ClientKind::PosibleCliente).await?,
    ))
}

async fn create_posible_cliente(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateLeadRequest>,
) -> impl IntoResponse {
    if require_auth(&state, &headers).await.is_err() {
        return error_response(StatusCode::UNAUTHORIZED, "no autorizado");
    }

    let cif = payload.cif.trim();
    let nombre_empresa = payload.nombre_empresa.trim();
    if cif.is_empty() || nombre_empresa.is_empty() {
        return error_response(
            StatusCode::BAD_REQUEST,
            "CIF y nombre de empresa son obligatorios",
        );
    }

    let result = sqlx::query(
        r#"
        INSERT INTO posibles_clientes (
            cif, nombre_empresa, telefono_contacto, necesidades, estado, direccion, tickets, url_archivos_adjuntos
        )
        VALUES ($1, $2, $3, $4, COALESCE($5, 'Nuevo'), $6, $7, $8)
        RETURNING cif
        "#,
    )
    .bind(cif)
    .bind(nombre_empresa)
    .bind(optional_trim(payload.telefono_contacto))
    .bind(optional_trim(payload.necesidades))
    .bind(optional_trim(payload.estado))
    .bind(optional_trim(payload.direccion))
    .bind(optional_trim(payload.tickets))
    .bind(optional_trim(payload.url_archivos_adjuntos))
    .fetch_one(&state.db)
    .await;

    let row = match result {
        Ok(row) => row,
        Err(error) => return database_error_response(error, "No se pudo crear el posible cliente"),
    };

    let created_cif: String = row.get("cif");
    match fetch_client_by_cif_kind(&state.db, ClientKind::PosibleCliente, &created_cif).await {
        Ok(Some(client)) => (StatusCode::CREATED, Json(serde_json::json!(client))),
        _ => error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Posible cliente creado, pero no se pudo recuperar",
        ),
    }
}

async fn apis_plantilla(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<ApiItem>>, StatusCode> {
    require_auth(&state, &headers).await?;
    Ok(Json(fetch_apis(&state.db, ApiKind::Plantilla).await?))
}

async fn create_api_plantilla(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateApiRequest>,
) -> impl IntoResponse {
    create_api(state, headers, payload, ApiKind::Plantilla).await
}

async fn apis_especificas(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<ApiItem>>, StatusCode> {
    require_auth(&state, &headers).await?;
    Ok(Json(fetch_apis(&state.db, ApiKind::Especifica).await?))
}

async fn create_api_especifica(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateApiRequest>,
) -> impl IntoResponse {
    create_api(state, headers, payload, ApiKind::Especifica).await
}

async fn create_api(
    state: AppState,
    headers: HeaderMap,
    payload: CreateApiRequest,
    kind: ApiKind,
) -> (StatusCode, Json<serde_json::Value>) {
    if require_auth(&state, &headers).await.is_err() {
        return error_response(StatusCode::UNAUTHORIZED, "no autorizado");
    }

    let id = payload.id.trim();
    let nombre = payload.nombre.trim();
    if id.is_empty() || nombre.is_empty() {
        return error_response(StatusCode::BAD_REQUEST, "ID y nombre son obligatorios");
    }

    let table = match kind {
        ApiKind::Plantilla => "api_plantilla",
        ApiKind::Especifica => "api_especifica",
    };

    let sql = format!(
        "INSERT INTO {table} (id, nombre, descripcion, url) VALUES ($1, $2, $3, $4) RETURNING id"
    );
    let result = sqlx::query(&sql)
        .bind(id)
        .bind(nombre)
        .bind(optional_trim(payload.descripcion))
        .bind(optional_trim(payload.url))
        .fetch_one(&state.db)
        .await;

    let row = match result {
        Ok(row) => row,
        Err(error) => return database_error_response(error, "No se pudo crear la API"),
    };

    let created_id: String = row.get("id");
    match fetch_api_by_id(&state.db, kind, &created_id).await {
        Ok(Some(api)) => (StatusCode::CREATED, Json(serde_json::json!(api))),
        _ => error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "API creada, pero no se pudo recuperar",
        ),
    }
}

async fn facturas(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Invoice>>, StatusCode> {
    require_auth(&state, &headers).await?;
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

async fn create_factura(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateInvoiceRequest>,
) -> impl IntoResponse {
    if require_auth(&state, &headers).await.is_err() {
        return error_response(StatusCode::UNAUTHORIZED, "no autorizado");
    }

    let nombre_empresa = payload.nombre_empresa.trim();
    let cif_cliente = payload.cif_cliente.trim();
    if nombre_empresa.is_empty() || cif_cliente.is_empty() {
        return error_response(
            StatusCode::BAD_REQUEST,
            "Nombre de empresa y CIF del cliente son obligatorios",
        );
    }

    let fecha = match parse_optional_date(payload.fecha) {
        Ok(fecha) => fecha,
        Err(message) => return error_response(StatusCode::BAD_REQUEST, &message),
    };

    let result = sqlx::query(
        r#"
        INSERT INTO facturas (nombre_empresa, url_factura, coste_facturacion, fecha, cif_cliente)
        VALUES ($1, $2, $3::numeric, COALESCE($4, CURRENT_DATE), $5)
        RETURNING id, nombre_empresa, COALESCE(url_factura, '') AS url_factura,
                  coste_facturacion::float8 AS coste_facturacion, fecha, cif_cliente
        "#,
    )
    .bind(nombre_empresa)
    .bind(optional_trim(payload.url_factura))
    .bind(payload.coste_facturacion)
    .bind(fecha)
    .bind(cif_cliente)
    .fetch_one(&state.db)
    .await;

    match result {
        Ok(row) => (
            StatusCode::CREATED,
            Json(serde_json::json!(Invoice {
                id: row.get("id"),
                nombre_empresa: row.get("nombre_empresa"),
                url_factura: row.get("url_factura"),
                coste_facturacion: row.get("coste_facturacion"),
                fecha: row.get("fecha"),
                cif_cliente: row.get("cif_cliente"),
            })),
        ),
        Err(error) => database_error_response(error, "No se pudo crear la factura"),
    }
}

async fn contratos(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Contract>>, StatusCode> {
    require_auth(&state, &headers).await?;
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

async fn incidencias(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Incident>>, StatusCode> {
    require_auth(&state, &headers).await?;
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

async fn github_repository_files(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<GitHubFilesRequest>,
) -> impl IntoResponse {
    if require_auth(&state, &headers).await.is_err() {
        return error_response(StatusCode::UNAUTHORIZED, "no autorizado");
    }

    let Some(repo) = parse_github_repo_url(&payload.url) else {
        return error_response(
            StatusCode::BAD_REQUEST,
            "La URL debe ser un repositorio de GitHub valido",
        );
    };

    let Ok(token) = std::env::var("GITHUB_TOKEN") else {
        return error_response(
            StatusCode::SERVICE_UNAVAILABLE,
            "Falta configurar GITHUB_TOKEN para leer repositorios privados",
        );
    };

    match fetch_github_files(&repo, &token).await {
        Ok(files) => (StatusCode::OK, Json(serde_json::json!(files))),
        Err(error) => error_response(StatusCode::BAD_GATEWAY, &error),
    }
}

async fn tags(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Tag>>, StatusCode> {
    require_auth(&state, &headers).await?;
    let rows = sqlx::query(
        "SELECT id, nombre, COALESCE(tipo, '') AS tipo, COALESCE(color, '') AS color FROM tags ORDER BY nombre",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(
        rows.into_iter()
            .map(|row| Tag {
                id: row.get("id"),
                nombre: row.get("nombre"),
                tipo: row.get("tipo"),
                color: row.get("color"),
            })
            .collect(),
    ))
}

async fn add_tag(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<TagMutationRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    require_auth(&state, &headers).await?;
    mutate_tag(&state.db, &payload, TagAction::Add).await?;
    Ok(Json(serde_json::json!({ "status": "ok" })))
}

async fn remove_tag(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<TagMutationRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    require_auth(&state, &headers).await?;
    mutate_tag(&state.db, &payload, TagAction::Remove).await?;
    Ok(Json(serde_json::json!({ "status": "ok" })))
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

enum TagAction {
    Add,
    Remove,
}

struct GitHubRepoRef {
    owner: String,
    repo: String,
    branch: Option<String>,
    path: Option<String>,
}

#[derive(serde::Deserialize)]
struct GitHubContentItem {
    name: String,
    path: String,
    #[serde(rename = "type")]
    item_type: String,
    html_url: Option<String>,
    size: Option<i64>,
}

fn parse_github_repo_url(url: &str) -> Option<GitHubRepoRef> {
    let normalized = url
        .trim()
        .trim_end_matches('/')
        .strip_suffix(".git")
        .unwrap_or(url.trim().trim_end_matches('/'));
    let without_scheme = normalized
        .strip_prefix("https://github.com/")
        .or_else(|| normalized.strip_prefix("http://github.com/"))?;
    let parts = without_scheme.split('/').collect::<Vec<_>>();

    if parts.len() < 2 || parts[0].is_empty() || parts[1].is_empty() {
        return None;
    }

    let mut repo_ref = GitHubRepoRef {
        owner: parts[0].to_string(),
        repo: parts[1].to_string(),
        branch: None,
        path: None,
    };

    if parts.len() >= 4 && parts[2] == "tree" {
        repo_ref.branch = Some(parts[3].to_string());
        if parts.len() > 4 {
            repo_ref.path = Some(parts[4..].join("/"));
        }
    }

    Some(repo_ref)
}

async fn fetch_github_files(
    repo: &GitHubRepoRef,
    token: &str,
) -> Result<Vec<GitHubFileItem>, String> {
    let path = repo.path.clone().unwrap_or_default();
    let mut api_url = format!(
        "https://api.github.com/repos/{}/{}/contents/{}",
        repo.owner, repo.repo, path
    );
    if let Some(branch) = &repo.branch {
        api_url.push_str(&format!("?ref={branch}"));
    }

    let response = reqwest::Client::new()
        .get(api_url)
        .header("Accept", "application/vnd.github+json")
        .header("Authorization", format!("Bearer {token}"))
        .header("User-Agent", "argonesa-crm")
        .send()
        .await
        .map_err(|error| format!("No se pudo conectar con GitHub: {error}"))?;

    if response.status() == reqwest::StatusCode::UNAUTHORIZED {
        return Err("GitHub ha rechazado el token configurado".to_string());
    }
    if response.status() == reqwest::StatusCode::FORBIDDEN {
        return Err("El token no tiene permisos para leer este repositorio".to_string());
    }
    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Err("Repositorio, rama o carpeta no encontrada en GitHub".to_string());
    }
    if !response.status().is_success() {
        return Err(format!("GitHub ha devuelto estado {}", response.status()));
    }

    let mut items = response
        .json::<Vec<GitHubContentItem>>()
        .await
        .map_err(|error| format!("No se pudo interpretar la respuesta de GitHub: {error}"))?;

    items.sort_by(|left, right| {
        let left_rank = if left.item_type == "dir" { 0 } else { 1 };
        let right_rank = if right.item_type == "dir" { 0 } else { 1 };
        left_rank
            .cmp(&right_rank)
            .then_with(|| left.name.to_lowercase().cmp(&right.name.to_lowercase()))
    });

    Ok(items
        .into_iter()
        .map(|item| GitHubFileItem {
            name: item.name,
            path: item.path,
            item_type: if item.item_type == "dir" {
                "folder".to_string()
            } else {
                "file".to_string()
            },
            html_url: item.html_url.unwrap_or_default(),
            size: item.size,
        })
        .collect())
}

fn optional_trim(value: Option<String>) -> Option<String> {
    value
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
}

fn parse_optional_date(value: Option<String>) -> Result<Option<NaiveDate>, String> {
    let Some(value) = optional_trim(value) else {
        return Ok(None);
    };
    NaiveDate::parse_from_str(&value, "%Y-%m-%d")
        .map(Some)
        .map_err(|_| "La fecha debe tener formato YYYY-MM-DD".to_string())
}

fn error_response(status: StatusCode, message: &str) -> (StatusCode, Json<serde_json::Value>) {
    (status, Json(serde_json::json!({ "error": message })))
}

fn database_error_response(
    error: sqlx::Error,
    fallback: &str,
) -> (StatusCode, Json<serde_json::Value>) {
    if let Some(db_error) = error.as_database_error() {
        if db_error.is_unique_violation() {
            return error_response(
                StatusCode::CONFLICT,
                "Ya existe un registro con ese identificador",
            );
        }
        if db_error.is_foreign_key_violation() {
            return error_response(StatusCode::BAD_REQUEST, "El registro relacionado no existe");
        }
        return error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            &format!("{fallback}: {}", db_error.message()),
        );
    }
    error_response(
        StatusCode::INTERNAL_SERVER_ERROR,
        &format!("{fallback}: {error}"),
    )
}

async fn mutate_tag(
    pool: &PgPool,
    payload: &TagMutationRequest,
    action: TagAction,
) -> Result<(), StatusCode> {
    let (table, entity_column) = match payload.entity_type.as_str() {
        "cliente" => ("clientes_tags", "id_cliente"),
        "posible_cliente" => ("posibles_clientes_tags", "id_posible_cliente"),
        "api_especifica" => ("apis_especificas_tags", "id_api_especifica"),
        "api_plantilla" => ("apis_plantilla_tags", "id_api_plantilla"),
        _ => return Err(StatusCode::BAD_REQUEST),
    };

    let sql = match action {
        TagAction::Add => format!(
            "INSERT INTO {table} ({entity_column}, id_tag) VALUES ($1, $2) ON CONFLICT DO NOTHING"
        ),
        TagAction::Remove => {
            format!("DELETE FROM {table} WHERE {entity_column} = $1 AND id_tag = $2")
        }
    };

    sqlx::query(&sql)
        .bind(&payload.entity_id)
        .bind(payload.tag_id)
        .execute(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(())
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
    fetch_client_by_cif_kind(pool, ClientKind::Cliente, cif).await
}

async fn fetch_client_by_cif_kind(
    pool: &PgPool,
    kind: ClientKind,
    cif: &str,
) -> Result<Option<Client>, sqlx::Error> {
    let clients = fetch_clients(pool, kind)
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

async fn fetch_api_by_id(
    pool: &PgPool,
    kind: ApiKind,
    id: &str,
) -> Result<Option<ApiItem>, StatusCode> {
    Ok(fetch_apis(pool, kind)
        .await?
        .into_iter()
        .find(|api| api.id == id))
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
