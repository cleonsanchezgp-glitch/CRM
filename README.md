# CRM para administracion de APIs

Primera base funcional para un CRM de servicios de automatizacion orientado a clientes, posibles clientes, APIs, contratos, facturas, tags y busqueda global.

## Estructura

- `backend/`: API Rust con Axum conectada a PostgreSQL.
- `frontend/`: interfaz Vite + TailwindCSS con navegacion modular.
- `database/schema.sql`: esquema PostgreSQL para la base de datos `CRM`.
- `database/seed.sql`: datos de prueba para comprobar la conexion real.
- `interfaz CRM/`: bocetos originales de referencia.

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

Frontend para produccion/local en un unico puerto:

```bash
cd frontend
npm run build
cd ../backend
cargo run
```

Despues abre:

```text
http://127.0.0.1:8080
```

Frontend en modo desarrollo, opcional:

```bash
cd frontend
npm run dev
```

El modo desarrollo abre `http://127.0.0.1:5173` y redirige `/api` al backend en `8080`.

Base de datos PostgreSQL:

```bash
psql -h localhost -p 5433 -U postgres -f database/schema.sql
psql -h localhost -p 5433 -U postgres -f database/seed.sql
```

Credenciales de entorno indicadas:

- Base de datos: `CRM`
- Puerto: `5433`
- Usuario: `postgres`
- Contrasenya: `1234`

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

1. Sustituir usuarios semilla por autenticacion real con sesiones o JWT.
2. Anadir CRUD completo por modulo.
3. Implementar subida segura de archivos adjuntos.
4. Integrar un servicio IA para el chatbot central cuando el proveedor este definido.
