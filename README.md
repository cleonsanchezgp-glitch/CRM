# CRM para gestion de clientes

Primera base funcional para un CRM de servicios de automatizacion orientado a gestionar clientes, posibles clientes, contratos, facturas, incidencias, tags y busqueda global. La gestion de APIs es un modulo concreto del negocio de Aelium, no la finalidad principal del CRM.

## Estructura

- `backend/`: API Rust con Axum conectada a PostgreSQL.
- `frontend/`: interfaz Vite + TailwindCSS con navegacion modular.
- `database/schema.sql`: esquema PostgreSQL para la base de datos `CRM`.
- `database/seed.sql`: datos de prueba para comprobar la conexion real.
- `interfaz CRM/`: bocetos originales de referencia.

## Ejecucion con Docker

La aplicacion queda separada en servicios independientes:

- `frontend`: Nginx sirve la app compilada en `http://127.0.0.1:5173` y reenvia `/api` al backend.
- `backend`: API Rust en `http://127.0.0.1:8080/api/health`.
- `database`: PostgreSQL en `localhost:5433`, inicializado con `database/schema.sql` y `database/seed.sql`.
- `keycloak`: proveedor OpenID Connect local en `http://127.0.0.1:8081`, con realm `crm` importado desde `keycloak/realm-export.json`.

```bash
docker compose up --build
```

Si tu instalacion usa Compose clasico:

```bash
docker-compose up --build
```

> Nota sobre Oracle: el backend actual usa `sqlx::PgPool` y SQL de PostgreSQL. Para usar una base de datos Oracle real no basta con cambiar el contenedor: hay que migrar el driver Rust, el esquema SQL, los placeholders de consultas y los scripts de seed.

## Ejecucion local

Backend:

```bash
cd backend
cargo run
```

Por defecto el backend usa:

```bash
postgres://postgres:1234@localhost:5433/CRM
```

Tambien puedes sobrescribirlo con `DATABASE_URL`.

El login antiguo con usuarios semilla y contrasenyas cifradas con AES-256 queda disponible solo si se fuerza `AUTH_MODE=local` para desarrollo. Por defecto, el backend espera tokens de Keycloak.

```bash
CRM_AES_KEY=crm-dev-aes-key-change-me
```

Para una clave propia en modo local, define `CRM_AES_KEY` antes de arrancar el backend y usa la misma clave al cifrar usuarios en PostgreSQL.

Frontend para produccion/local separado del backend:

```bash
cd frontend
npm run build
```

Despues sirve `frontend/dist` con un servidor estatico o usa Docker. El backend ya no sirve automaticamente el frontend.

Frontend en modo desarrollo, opcional:

```bash
cd frontend
npm run dev
```

El modo desarrollo abre `http://127.0.0.1:5173` y redirige `/api` al backend en `8080`. Puedes cambiar el destino con `VITE_PROXY_API_TARGET`.

Base de datos PostgreSQL:

```bash
psql -h localhost -p 5433 -U postgres -f database/schema.sql
psql -h localhost -p 5433 -U postgres -f database/seed.sql
```

Si ya tienes la base creada y solo quieres actualizar usuarios para el login AES:

```bash
psql -h localhost -p 5433 -U postgres -f database/update_users_aes.sql
```

Credenciales de entorno indicadas:

- Base de datos: `CRM`
- Puerto: `5433`
- Usuario: `postgres`
- Contrasenya: `1234`

## Autenticacion

El backend soporta tres modos mediante `AUTH_MODE`, pero el stack Docker arranca en `keycloak` por defecto:

- `keycloak`: modo principal. Desactiva `/api/auth/login` y solo acepta tokens de Keycloak.
- `hybrid`: modo transitorio opcional; acepta access tokens de Keycloak y solo acepta sesiones locales si tambien se define `ALLOW_LOCAL_AUTH=true`.
- `local`: modo de desarrollo excepcional; usa login semilla contra PostgreSQL y sesiones en memoria solo si tambien se define `ALLOW_LOCAL_AUTH=true`.

La pantalla de login del CRM no redirige al formulario hospedado de Keycloak. El formulario del CRM pide usuario y contrasenya, solicita un token a Keycloak mediante Direct Access Grants y luego llama al backend con `Authorization: Bearer <access_token>`.

Keycloak local queda disponible en:

- Consola: `http://127.0.0.1:8081`
- Admin: `admin` / `admin`
- Realm: `crm`
- Cliente OIDC publico: `crm-frontend`
- Usuarios CRM de desarrollo: `Manu` / `1234` y `Carlos` / `1234`
- Rol requerido por el backend: `crm_user`

Para ejecutar el backend local contra el Keycloak de Docker:

```bash
$env:AUTH_MODE="keycloak"
$env:KEYCLOAK_ISSUER="http://127.0.0.1:8081/realms/crm"
$env:KEYCLOAK_ALLOWED_ISSUERS="http://keycloak:8080/realms/crm"
$env:KEYCLOAK_CLIENT_ID="crm-frontend"
$env:KEYCLOAK_REQUIRED_ROLE="crm_user"
cd backend
cargo run
```

Para ejecutar el frontend Vite con login Keycloak embebido:

```bash
$env:VITE_AUTH_MODE="keycloak"
$env:VITE_KEYCLOAK_URL="http://127.0.0.1:8081"
$env:VITE_KEYCLOAK_REALM="crm"
$env:VITE_KEYCLOAK_CLIENT_ID="crm-frontend"
cd frontend
npm run dev
```

## Endpoints principales

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/clientes`
- `GET /api/clientes/{cif}`
- `GET /api/posibles-clientes`
- `GET /api/apis/plantilla`
- `GET /api/apis/especificas`
- `GET /api/facturas`
- `GET /api/contratos`
- `GET /api/incidencias`
## Siguientes pasos recomendados

1. Endurecer el despliegue Keycloak para entornos no locales: TLS, secretos, backups, rotacion de claves y politicas de contrasenya.
2. Anadir CRUD completo por modulo.
3. Implementar subida segura de archivos adjuntos.
4. Integrar un servicio IA para el chatbot central cuando el proveedor este definido.
