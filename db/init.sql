SELECT 'CREATE DATABASE bd_north_south'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bd_north_south')\gexec
-- Conectar a la base de datos creada
\c bd_north_south
-- Crear la extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear la extensión para pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear la secuencia para el campo count
CREATE SEQUENCE IF NOT EXISTS user_count_seq START 0;

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
    count INT NOT NULL DEFAULT nextval('user_count_seq'),
    name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    user_name VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role roles NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar un usuario admin por defecto si no existe
-- Insertar información de José Rivas en la tabla user
INSERT INTO users (count, name, last_name, user_name, email, password, role)
VALUES (nextval('user_count_seq'),'Jose', 'Rivas', 'joserivas', 'joserivas@ejemplo.com', crypt('Sk79^o&V@$qq', gen_salt('bf')), 'ADMIN') ON CONFLICT (user_name) DO NOTHING; -- Evita insertar si ya existe un usuario con ese username

