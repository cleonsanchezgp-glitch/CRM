CREATE DATABASE "CRM";

\connect "CRM";

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
    usuario VARCHAR PRIMARY KEY,
    contrasenya VARCHAR NOT NULL,
    permisos JSONB NOT NULL DEFAULT '{}'::jsonb,
    rol VARCHAR NOT NULL DEFAULT 'usuario'
);

CREATE TABLE clientes (
    CIF VARCHAR PRIMARY KEY,
    nombre_empresa VARCHAR NOT NULL,
    telefono_contacto VARCHAR,
    necesidades TEXT,
    direccion VARCHAR,
    url_archivos_adjuntos VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE posibles_clientes (
    CIF VARCHAR PRIMARY KEY,
    nombre_empresa VARCHAR NOT NULL,
    telefono_contacto VARCHAR,
    necesidades TEXT,
    estado VARCHAR,
    direccion VARCHAR,
    tickets TEXT,
    url_archivos_adjuntos VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE API_especifica (
    id VARCHAR PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    url VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE API_plantilla (
    id VARCHAR PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    descripcion TEXT,
    url VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE facturas (
    id BIGSERIAL PRIMARY KEY,
    nombre_empresa VARCHAR NOT NULL,
    url_factura VARCHAR,
    coste_facturacion DECIMAL(12,2) NOT NULL DEFAULT 0,
    fecha DATE,
    CIF_cliente VARCHAR NOT NULL REFERENCES clientes(CIF) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE contratos (
    id BIGSERIAL PRIMARY KEY,
    nombre_empresa VARCHAR NOT NULL,
    url_contrato VARCHAR,
    fecha DATE,
    CIF_cliente VARCHAR NOT NULL REFERENCES clientes(CIF) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE incidencias (
    id VARCHAR PRIMARY KEY,
    nombre_empresa VARCHAR NOT NULL,
    titulo_incidencia VARCHAR NOT NULL,
    descripcion_incidencia TEXT,
    imagenes_incidencia TEXT,
    id_cliente VARCHAR NOT NULL REFERENCES clientes(CIF) ON DELETE CASCADE
);

CREATE TABLE clientes_APIs_plantilla (
    CIF_cliente VARCHAR REFERENCES clientes(CIF) ON DELETE CASCADE,
    id_API_plantilla VARCHAR REFERENCES API_plantilla(id) ON DELETE CASCADE,
    PRIMARY KEY (CIF_cliente, id_API_plantilla)
);

CREATE TABLE clientes_APIs_especificas (
    CIF_cliente VARCHAR REFERENCES clientes(CIF) ON DELETE CASCADE,
    id_API_especifica VARCHAR REFERENCES API_especifica(id) ON DELETE CASCADE,
    PRIMARY KEY (CIF_cliente, id_API_especifica)
);

CREATE TABLE posibles_clientes_APIs_plantilla (
    CIF_posible_cliente VARCHAR REFERENCES posibles_clientes(CIF) ON DELETE CASCADE,
    id_API_plantilla VARCHAR REFERENCES API_plantilla(id) ON DELETE CASCADE,
    PRIMARY KEY (CIF_posible_cliente, id_API_plantilla)
);

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR UNIQUE NOT NULL,
    tipo VARCHAR,
    color VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE clientes_tags (
    id_cliente VARCHAR REFERENCES clientes(CIF) ON DELETE CASCADE,
    id_tag BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (id_cliente, id_tag)
);

CREATE TABLE posibles_clientes_tags (
    id_posible_cliente VARCHAR REFERENCES posibles_clientes(CIF) ON DELETE CASCADE,
    id_tag BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (id_posible_cliente, id_tag)
);

CREATE TABLE APIs_especificas_tags (
    id_API_especifica VARCHAR REFERENCES API_especifica(id) ON DELETE CASCADE,
    id_tag BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (id_API_especifica, id_tag)
);

CREATE TABLE APIs_plantilla_tags (
    id_API_plantilla VARCHAR REFERENCES API_plantilla(id) ON DELETE CASCADE,
    id_tag BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (id_API_plantilla, id_tag)
);

CREATE INDEX idx_clientes_nombre ON clientes USING gin (to_tsvector('spanish', nombre_empresa));
CREATE INDEX idx_posibles_clientes_nombre ON posibles_clientes USING gin (to_tsvector('spanish', nombre_empresa));
CREATE INDEX idx_api_plantilla_nombre ON API_plantilla USING gin (to_tsvector('spanish', nombre));
CREATE INDEX idx_api_especifica_nombre ON API_especifica USING gin (to_tsvector('spanish', nombre));
CREATE INDEX idx_tags_nombre ON tags (lower(nombre));

INSERT INTO usuarios (usuario, contrasenya, permisos, rol) VALUES
('Manu', crypt('1234', gen_salt('bf')), '{"all": true}'::jsonb, 'administrador'),
('Carlos', crypt('1234', gen_salt('bf')), '{"all": true}'::jsonb, 'administrador');
