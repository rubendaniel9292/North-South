SELECT 'CREATE DATABASE bd_north_south'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bd_north_south')\gexec
-- Conectar a la base de datos creada
\c bd_north_south
-- Crear la extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear la extensión para pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear el tipo ENUM para roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'roles') THEN
        CREATE TYPE roles AS ENUM ('BASIC', 'ADMIN');
    END IF;
END
$$;

-- Crear la tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    user_name VARCHAR(60) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role roles NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_name, email)
);

-- Insertar un usuario admin por defecto si no existe
INSERT INTO users (name, last_name, user_name, email, password, role)
VALUES ('Jose', 'Rivas', 'joserivas', 'joserivas@ejemplo.com', crypt('Sk79^o&V@$qq', gen_salt('bf')), 'ADMIN')
ON CONFLICT (email) DO NOTHING;-- Evita insertar si ya existe un usuario con ese username

--LISTAR USUARIOS
SELECT * FROM users;
--LISTAR USUARIO POR ID
SELECT * FROM users WHERE id = '31850ef1-7e45-4164-a97f-066fea0c1016';

--CONTAR USUARIOS
SELECT *, COUNT(*) OVER () AS total
FROM users;

--ELIMINAR UN USUARIO ESPECIFICO (OPCIONAL)
DELETE FROM users
WHERE user_name = 'joserivas';
DELETE FROM users
WHERE user_name = 'angiezge';
DELETE FROM users
WHERE id = '780a7470-f485-436e-816f-ce33c5cca75e';