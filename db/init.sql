SELECT 'CREATE DATABASE bd_north_south'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bd_north_south')\gexec
-- Conectar a la base de datos creada
\c bd_north_south

-- Crear la tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar un usuario admin por defecto si no existe
INSERT INTO users (username, email, password, role)
SELECT 'admin', 'admin@example.com', crypt('adminpassword', gen_salt('bf')), 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
