use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize)]
pub struct Tag {
    pub id: i64,
    pub nombre: String,
    pub tipo: String,
    pub color: String,
}

#[derive(Clone, Serialize)]
pub struct ApiItem {
    pub id: String,
    pub nombre: String,
    pub descripcion: String,
    pub url: String,
    pub tags: Vec<Tag>,
    pub clientes_relacionados: Vec<String>,
    pub posibles_clientes_relacionados: Vec<String>,
}

#[derive(Clone, Serialize)]
pub struct Client {
    pub cif: String,
    pub nombre_empresa: String,
    pub telefono_contacto: String,
    pub necesidades: String,
    pub direccion: String,
    pub estado: String,
    pub tags: Vec<Tag>,
    pub apis_plantilla: Vec<ApiItem>,
    pub apis_especificas: Vec<ApiItem>,
}

#[derive(Deserialize)]
pub struct CreateClientRequest {
    pub cif: String,
    pub nombre_empresa: String,
    pub telefono_contacto: Option<String>,
    pub necesidades: Option<String>,
    pub direccion: Option<String>,
    pub url_archivos_adjuntos: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateLeadRequest {
    pub cif: String,
    pub nombre_empresa: String,
    pub telefono_contacto: Option<String>,
    pub necesidades: Option<String>,
    pub estado: Option<String>,
    pub direccion: Option<String>,
    pub tickets: Option<String>,
    pub url_archivos_adjuntos: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateApiRequest {
    pub id: String,
    pub nombre: String,
    pub descripcion: Option<String>,
    pub url: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateInvoiceRequest {
    pub nombre_empresa: String,
    pub url_factura: Option<String>,
    pub coste_facturacion: f64,
    pub fecha: Option<String>,
    pub cif_cliente: String,
}

#[derive(Deserialize)]
pub struct GitHubFilesRequest {
    pub url: String,
}

#[derive(Serialize)]
pub struct GitHubFileItem {
    pub name: String,
    pub path: String,
    pub item_type: String,
    pub html_url: String,
    pub size: Option<i64>,
}

#[derive(Clone, Serialize)]
pub struct Invoice {
    pub id: i64,
    pub nombre_empresa: String,
    pub url_factura: String,
    pub coste_facturacion: f64,
    pub fecha: NaiveDate,
    pub cif_cliente: String,
}

#[derive(Clone, Serialize)]
pub struct Contract {
    pub id: i64,
    pub nombre_empresa: String,
    pub url_contrato: String,
    pub fecha: NaiveDate,
    pub cif_cliente: String,
}

#[derive(Clone, Serialize)]
pub struct Incident {
    pub id: String,
    pub nombre_empresa: String,
    pub titulo_incidencia: String,
    pub descripcion_incidencia: String,
    pub id_cliente: String,
}

#[derive(Clone, Serialize)]
pub struct Dashboard {
    pub clientes: usize,
    pub posibles_clientes: usize,
    pub apis_plantilla: usize,
    pub apis_especificas: usize,
    pub facturas_pendientes: usize,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub usuario: String,
    pub contrasenya: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub usuario: String,
    pub rol: String,
}

#[derive(Deserialize)]
pub struct TagMutationRequest {
    pub entity_type: String,
    pub entity_id: String,
    pub tag_id: i64,
}
