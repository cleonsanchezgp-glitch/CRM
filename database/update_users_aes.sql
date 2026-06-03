\connect "CRM";

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
