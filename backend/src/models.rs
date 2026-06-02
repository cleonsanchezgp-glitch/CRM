use chrono::NaiveDate;
use serde::Serialize;

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
