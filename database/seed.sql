\connect "CRM";

TRUNCATE TABLE
    APIs_plantilla_tags,
    APIs_especificas_tags,
    posibles_clientes_tags,
    clientes_tags,
    posibles_clientes_APIs_plantilla,
    clientes_APIs_especificas,
    clientes_APIs_plantilla,
    incidencias,
    contratos,
    facturas,
    API_especifica,
    API_plantilla,
    posibles_clientes,
    clientes,
    tags
RESTART IDENTITY CASCADE;

WITH credenciales(usuario, contrasenya_plana, permisos, rol) AS (
    VALUES
    ('Manu', '1234', '{"all": true}'::jsonb, 'administrador'),
    ('Carlos', '1234', '{"all": true}'::jsonb, 'administrador')
),
cifradas AS (
    SELECT
        usuario,
        encode(iv, 'base64') || ':' ||
        encode(
            encrypt_iv(
                convert_to(contrasenya_plana, 'UTF8'),
                digest(COALESCE(current_setting('crm.aes_key', true), 'crm-dev-aes-key-change-me'), 'sha256'),
                iv,
                'aes-cbc/pad:pkcs'
            ),
            'base64'
        ) AS contrasenya,
        permisos,
        rol
    FROM credenciales
    CROSS JOIN LATERAL (SELECT gen_random_bytes(16) AS iv) nonce
)
INSERT INTO usuarios (usuario, contrasenya, permisos, rol)
SELECT usuario, contrasenya, permisos, rol FROM cifradas
ON CONFLICT (usuario) DO UPDATE SET
    contrasenya = EXCLUDED.contrasenya,
    permisos = EXCLUDED.permisos,
    rol = EXCLUDED.rol;

INSERT INTO tags (nombre, tipo, color) VALUES
('Docker', 'tecnologia', '#7c8569'),
('IA', 'servicio', '#de733e'),
('Webhook', 'integracion', '#52493a'),
('Urgente', 'prioridad', '#de733e'),
('Spring_boot', 'backend', '#a4ab80'),
('Facturacion', 'proceso', '#7c8569');

INSERT INTO clientes (CIF, nombre_empresa, telefono_contacto, necesidades, direccion, url_archivos_adjuntos) VALUES
('B12345678', 'Acme Talleres', '+34 600 111 222', 'Automatizar entrada de facturas y conciliacion con ERP.', 'Calle Industria 12, Valencia', 'https://files.local/clientes/acme'),
('B87654321', 'Nova Clinics', '+34 611 333 444', 'Clasificar solicitudes y reducir tiempos de respuesta.', 'Avenida Salud 45, Madrid', 'https://files.local/clientes/nova'),
('B11223344', 'Mercurio Distribucion', '+34 622 222 111', 'Centralizar pedidos B2B y avisos de stock.', 'Poligono Sur 7, Sevilla', 'https://files.local/clientes/mercurio');

INSERT INTO posibles_clientes (CIF, nombre_empresa, telefono_contacto, necesidades, estado, direccion, tickets, url_archivos_adjuntos) VALUES
('P44556677', 'Logistica Norte', '+34 622 555 777', 'Centralizar albaranes y avisos de entrega.', 'Propuesta enviada', 'Poligono Norte 8, Bilbao', 'TCK-1001,TCK-1002', 'https://files.local/prospectos/logistica-norte'),
('P99887766', 'Estudio Prisma', '+34 633 777 999', 'Automatizar formularios de nuevos proyectos.', 'Demo pendiente', 'Ronda Centro 21, Zaragoza', 'TCK-1003', 'https://files.local/prospectos/prisma'),
('P22446688', 'Clinica Alba', '+34 644 888 222', 'Automatizar admision de pacientes y recordatorios.', 'Contacto inicial', 'Calle Mayor 9, Malaga', 'TCK-1004', 'https://files.local/prospectos/alba');

INSERT INTO API_plantilla (id, nombre, descripcion, url) VALUES
('TPL-FACT-001', 'Extractor de facturas', 'Plantilla para leer facturas PDF y exponer datos normalizados.', 'https://git.local/crm/apis/tpl-facturas'),
('TPL-WHK-002', 'Router de webhooks', 'Entrada segura para eventos de terceros con reintentos y trazabilidad.', 'https://git.local/crm/apis/tpl-webhooks'),
('TPL-CRM-003', 'Sincronizador CRM', 'Plantilla para importar contactos y oportunidades desde formularios externos.', 'https://git.local/crm/apis/tpl-crm');

INSERT INTO API_especifica (id, nombre, descripcion, url) VALUES
('API-ACME-001', 'Conector ERP Acme', 'Sincroniza pedidos, stocks y estados de facturacion con el ERP del cliente.', 'https://git.local/crm/apis/acme-erp'),
('API-NOVA-014', 'Clasificador de tickets Nova', 'Prioriza incidencias y propone respuestas internas para soporte.', 'https://git.local/crm/apis/nova-tickets'),
('API-MERC-003', 'Portal pedidos Mercurio', 'Publica pedidos B2B y actualiza inventario en tiempo casi real.', 'https://git.local/crm/apis/mercurio-pedidos');

INSERT INTO clientes_APIs_plantilla (CIF_cliente, id_API_plantilla) VALUES
('B12345678', 'TPL-FACT-001'),
('B87654321', 'TPL-WHK-002'),
('B11223344', 'TPL-CRM-003');

INSERT INTO clientes_APIs_especificas (CIF_cliente, id_API_especifica) VALUES
('B12345678', 'API-ACME-001'),
('B87654321', 'API-NOVA-014'),
('B11223344', 'API-MERC-003');

INSERT INTO posibles_clientes_APIs_plantilla (CIF_posible_cliente, id_API_plantilla) VALUES
('P44556677', 'TPL-FACT-001'),
('P99887766', 'TPL-WHK-002'),
('P22446688', 'TPL-CRM-003');

INSERT INTO clientes_tags (id_cliente, id_tag)
SELECT 'B12345678', id FROM tags WHERE nombre IN ('Docker', 'IA', 'Facturacion');
INSERT INTO clientes_tags (id_cliente, id_tag)
SELECT 'B87654321', id FROM tags WHERE nombre IN ('IA', 'Urgente');
INSERT INTO clientes_tags (id_cliente, id_tag)
SELECT 'B11223344', id FROM tags WHERE nombre IN ('Webhook', 'Spring_boot');

INSERT INTO posibles_clientes_tags (id_posible_cliente, id_tag)
SELECT 'P44556677', id FROM tags WHERE nombre IN ('Webhook', 'Facturacion');
INSERT INTO posibles_clientes_tags (id_posible_cliente, id_tag)
SELECT 'P99887766', id FROM tags WHERE nombre IN ('Docker', 'Spring_boot');
INSERT INTO posibles_clientes_tags (id_posible_cliente, id_tag)
SELECT 'P22446688', id FROM tags WHERE nombre IN ('IA', 'Webhook');

INSERT INTO APIs_plantilla_tags (id_API_plantilla, id_tag)
SELECT 'TPL-FACT-001', id FROM tags WHERE nombre IN ('IA', 'Docker', 'Facturacion');
INSERT INTO APIs_plantilla_tags (id_API_plantilla, id_tag)
SELECT 'TPL-WHK-002', id FROM tags WHERE nombre IN ('Webhook', 'Spring_boot');
INSERT INTO APIs_plantilla_tags (id_API_plantilla, id_tag)
SELECT 'TPL-CRM-003', id FROM tags WHERE nombre IN ('Webhook', 'Docker');

INSERT INTO APIs_especificas_tags (id_API_especifica, id_tag)
SELECT 'API-ACME-001', id FROM tags WHERE nombre IN ('Docker', 'Webhook');
INSERT INTO APIs_especificas_tags (id_API_especifica, id_tag)
SELECT 'API-NOVA-014', id FROM tags WHERE nombre IN ('IA', 'Urgente');
INSERT INTO APIs_especificas_tags (id_API_especifica, id_tag)
SELECT 'API-MERC-003', id FROM tags WHERE nombre IN ('Spring_boot', 'Webhook');

INSERT INTO facturas (nombre_empresa, url_factura, coste_facturacion, fecha, CIF_cliente) VALUES
('Acme Talleres', 'https://files.local/facturas/acme-mayo.pdf', 740.00, '2026-05-30', 'B12345678'),
('Nova Clinics', 'https://files.local/facturas/nova-mayo.pdf', 1260.00, '2026-05-28', 'B87654321'),
('Mercurio Distribucion', 'https://files.local/facturas/mercurio-mayo.pdf', 980.00, '2026-05-25', 'B11223344');

INSERT INTO contratos (nombre_empresa, url_contrato, fecha, CIF_cliente) VALUES
('Acme Talleres', 'https://files.local/contratos/acme.pdf', '2026-04-10', 'B12345678'),
('Nova Clinics', 'https://files.local/contratos/nova.pdf', '2026-04-18', 'B87654321'),
('Mercurio Distribucion', 'https://files.local/contratos/mercurio.pdf', '2026-05-02', 'B11223344');

INSERT INTO incidencias (id, nombre_empresa, titulo_incidencia, descripcion_incidencia, imagenes_incidencia, id_cliente) VALUES
('INC-0001', 'Nova Clinics', 'Webhook con reintentos agotados', 'Revisar credenciales del sistema externo.', '', 'B87654321'),
('INC-0002', 'Acme Talleres', 'Factura no reconocida', 'El OCR no identifica correctamente un proveedor nuevo.', '', 'B12345678');
