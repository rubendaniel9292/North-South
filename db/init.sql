SELECT 'CREATE DATABASE bd_north_south'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bd_north_south')\ gexec 
-- Conectar a la base de datos creada
\c bd_north_south
-- Crear la extensión para UUID
CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";
-- Crear la extensión para pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Crear la tabla users si no existe-- Crear la tabla users si no existe
-- Crear la tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    first_name VARCHAR(60) NOT NULL,
    second_name VARCHAR(60),
    surname VARCHAR(60) NOT NULL,
    second_surname VARCHAR(60),
    user_name VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role text NOT NULL CHECK (role IN ('BASIC', 'ADMIN')) DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar un usuario admin por defecto si no existe
-- Insertar un usuario admin por defecto si no existe
INSERT INTO users (first_name ,surname, user_name, email, password, role)
VALUES ('Jose', 'Rivas', 'joserivas2', 'joserivas@ejemplo.com', crypt('Sk79o&V@$qq', gen_salt('bf')), 'ADMIN')
ON CONFLICT (user_name) DO NOTHING;-- Evita insertar si ya existe un usuario con ese username

--LISTAR USUARIOS
SELECT * FROM users;
--LISTAR USUARIO POR ID
SELECT * FROM users WHERE id = 'd4400ade-abd7-4a88-9041-5c7ad7d6a509';

--CONTAR USUARIOS
SELECT *, COUNT(*) OVER () AS total
FROM users;

--ELIMINAR UN USUARIO ESPECIFICO (OPCIONAL)
DELETE FROM users
WHERE user_name = 'joserivas';
DELETE FROM users
WHERE user_name = 'angiezge9';
DELETE FROM users
WHERE id = '780a7470-f485-436e-816f-ce33c5cca75e';

--TABLAS PARA LA GESTION DE CLIENTES--

--1 estado civil
CREATE TABLE IF NOT EXISTS civil_status (
    id bigint primary key generated restart as identity NOT NULL,  
    status VARCHAR(20) NOT NULL unique
);


-- Insertar estados a la tabla estado civil
INSERT INTO civil_status (status) VALUES ('Soltero'),('Casado'), ('Viudo'),('Divorciado'),('Unión Libre'),('Unión de Hecho');
--tipo de poliza policy
SELECT * FROM civil_status;

--2 provincia, relacion Uno a muchos 
CREATE TABLE IF NOT EXISTS province (
    id bigint primary key generated restart as identity NOT NULL,
    province_name VARCHAR(255) NOT NULL unique
);
--insetar datos a la tabla provincia
INSERT INTO province (province_name) VALUES
('Azuay'),
('Bolívar'),
('Cañar'),
('Carchi'),
('Chimborazo'),
('Cotopaxi'),
('El Oro'),
('Esmeraldas'),
('Galápagos'),
('Guayas'),
('Imbabura'),
('Loja'),
('Los Ríos'),
('Manabí'),
('Morona Santiago'),
('Napo'),
('Sucumbíos'),
('Pastaza'),
('Pichincha'),
('Santa Elena'),
('Santo Domingo de Los Tsáchilas'),
('Francisco de Orellana'),
('Tungurahua'),
('Zamora-Chinchipe');

select * from province;
SELECT id, province_name FROM province;
	
--Creacion de la tabla ciudad/canton
CREATE TABLE IF NOT EXISTS city (
    id bigint primary key generated restart as identity NOT NULL, 
    city_name VARCHAR(255) NOT NULL,
    province_id INTEGER NOT NULL,
    FOREIGN KEY (province_id) REFERENCES province(id) ON DELETE RESTRICT
);

--insertar las ciudades a azuay
INSERT INTO city (city_name, province_id) VALUES
('Cuenca', 1),
('Girón', 1),
('Gualaceo', 1),
('Nabón', 1),
('Paute', 1),
('Ponce Enríquez', 1),
('Santa Isabel', 1),
('Sevilla de Oro', 1),
('Sígsig', 1),
('Oña', 1),
('Chordeleg', 1),
('El Pan', 1);

--insertar las ciudades bolivar
INSERT INTO city (city_name, province_id) VALUES
('Guaranda', 2),
('Caluma', 2),
('Chillanes', 2),
('Chimbo', 2),
('Echeandía', 2),
('Las Naves', 2),
('San Miguel', 2);

--insertar las ciudades de cañar
INSERT INTO city (city_name, province_id) VALUES
('Azogues', 3),
('Biblián', 3),
('Cañar', 3),
('Déleg', 3),
('El Tambo', 3),
('La Troncal', 3),
('Suscal', 3);

--insterar las ciudadfes de carchi 
INSERT INTO city (city_name, province_id) VALUES
('Tulcán', 4),
('Bolívar', 4),
('Espejo', 4),
('Mira', 4),
('Montúfar', 4),
('Huaca', 4);

--insterar las ciudades de chimborazo 
INSERT INTO city (city_name, province_id) VALUES
('Riobamba', 5),
('Alausí', 5),
('Chambo', 5),
('Chunchi', 5),
('Colta', 5),
('Cumandá', 5),
('Guamote', 5),
('Guano', 5),
('Pallatanga', 5),
('Penipe', 5);


--insertar las ciudades de cotopaxi
INSERT INTO city (city_name, province_id) VALUES
('Latacunga', 6),
('La Maná', 6),
('Pangua', 6),
('Pujilí', 6),
('Salcedo', 6),
('Saquisilí', 6),
('Sigchos', 6);

--insertar las ciuades o cantones del oro
INSERT INTO city (city_name, province_id) VALUES
('Machala', 7),
('Arenillas', 7),
('Atahualpa', 7),
('Balsas', 7),
('Chilla', 7),
('El Guabo', 7),
('Huaquillas', 7),
('Las Lajas', 7),
('Marcabelí', 7),
('Pasaje', 7),
('Piñas', 7),
('Portovelo', 7),
('Santa Rosa', 7),
('Zaruma', 7);

--insertar las ciuades de esmeraldas
INSERT INTO city (city_name, province_id) VALUES
('Esmeraldas', 8),
('Atacames', 8),
('Eloy Alfaro', 8),
('Muisne', 8),
('Quinindé', 8),
('Rioverde', 8),
('San Lorenzo', 8);

--insertar ciudades de galapagos 
INSERT INTO city (city_name, province_id) VALUES
('San Cristóbal', 9),
('Isabela', 9),
('Santa Cruz', 9);

--insertar ciudades del guayas
INSERT INTO city (city_name, province_id) VALUES
('Guayaquil', 10),
('Alfredo Baquerizo Moreno', 10),
('Balao', 10),
('Balzar', 10),
('Colimes', 10),
('Daule', 10),
('Durán', 10),
('El Empalme', 10),
('El Triunfo', 10),
('General Antonio Elizalde', 10),
('Isidro Ayora', 10),
('Lomas de Sargentillo', 10),
('Marcelino Maridueña', 10),
('Milagro', 10),
('Naranjal', 10),
('Naranjito', 10),
('Nobol', 10),
('Palestina', 10),
('Pedro Carbo', 10),
('Playas', 10),
('Salitre', 10),
('Samborondón', 10),
('Santa Lucía', 10),
('Simón Bolívar', 10),
('Yaguachi', 10);

--ciudades de imbabura
INSERT INTO city (city_name, province_id) VALUES
('Ibarra', 11),
('Antonio Ante', 11),
('Cotacachi', 11),
('Otavalo', 11),
('Pimampiro', 11),
('San Miguel de Urcuquí', 11);

--ciudades de loja
INSERT INTO city (city_name, province_id) VALUES
('Loja', 12),
('Calvas', 12),
('Catamayo', 12),
('Celica', 12),
('Chaguarpamba', 12),
('Espíndola', 12),
('Gonzanamá', 12),
('Macará', 12),
('Olmedo', 12),
('Paltas', 12),
('Pindal', 12),
('Puyango', 12),
('Quilanga', 12),
('Saraguro', 12),
('Sozoranga', 12),
('Zapotillo', 12);

--ciudades de los rios
INSERT INTO city (city_name, province_id) VALUES
('Babahoyo', 13),
('Baba', 13),
('Buena Fé', 13),
('Mocache', 13),
('Montalvo', 13),
('Palenque', 13),
('Pueblo Viejo', 13),
('Quevedo', 13),
('Quinsaloma', 13),
('Urdaneta', 13),
('Valencia', 13),
('Ventanas', 13),
('Vinces', 13);

--ciudades de manabi 
INSERT INTO city (city_name, province_id) VALUES
('Portoviejo', 14),
('24 de Mayo', 14),
('Bolívar', 14),
('Chone', 14),
('El Carmen', 14),
('Flavio Alfaro', 14),
('Jama', 14),
('Jaramijó', 14),
('Jipijapa', 14),
('Junín', 14),
('Manta', 14),
('Montecristi', 14),
('Olmedo', 14),
('Paján', 14),
('Pedernales', 14),
('Pichincha', 14),
('Puerto López', 14),
('Rocafuerte', 14),
('San Vicente', 14),
('Santa Ana', 14),
('Sucre', 14),
('Tosagua', 14);

--ciudades de morona
INSERT INTO city (city_name, province_id) VALUES
('Morona', 15),
('Gualaquiza', 15),
('Huamboya', 15),
('Limón Indanza', 15),
('Logroño', 15),
('Pablo Sexto', 15),
('Palora', 15),
('San Juan Bosco', 15),
('Santiago de Méndez', 15),
('Sucúa', 15),
('Taisha', 15),
('Tiwintza', 15);

--ciuades del tena
INSERT INTO city (city_name, province_id) VALUES
('Tena', 16),
('Archidona', 16),
('Carlos Julio Arosemena Tola', 16),
('El Chaco', 16),
('Quijos', 16);

--ciudades del sucumbios
INSERT INTO city (city_name, province_id) VALUES
('Lago Agrio', 17),
('Cascales', 17),
('Cuyabeno', 17),
('Gonzalo Pizarro', 17),
('Putumayo', 17),
('Shushufindi', 17),
('Sucumbíos', 17);

--ciudades de pichincha
INSERT INTO city (city_name, province_id) VALUES
('Quito', 19),
('Cayambe', 19),
('Mejía', 19),
('Pedro Moncayo', 19),
('Pedro Vicente Maldonado', 19),
('Puerto Quito', 19),
('Rumiñahui', 19),
('San Miguel de los Bancos', 19);

--ciudades de santa elena
INSERT INTO city (city_name, province_id) VALUES
('Santa Elena', 20),
('La Libertad', 20),
('Salinas', 20);

--ciudades de santo domingo
INSERT INTO city (city_name, province_id) VALUES
('Santo Domingo', 21),
('La Concordia', 21);

--ciudades de orellana
INSERT INTO city (city_name, province_id) VALUES
('Francisco de Orellana', 22),
('Aguarico', 22),
('La Joya de los Sachas', 22),
('Loreto', 22);

--ciudades de tunguragua 
INSERT INTO city (city_name, province_id) VALUES
('Ambato', 23),
('Baños de Agua Santa', 23),
('Cevallos', 23),
('Mocha', 23),
('Patate', 23),
('Quero', 23),
('San Pedro de Pelileo', 23),
('Santiago de Píllaro', 23),
('Tisaleo', 23);

--ciudades de zamora
INSERT INTO city (city_name, province_id) VALUES
('Zamora', 24),
('Centinela del Cóndor', 24),
('Chinchipe', 24),
('El Pangui', 24),
('Nangaritza', 24),
('Palanda', 24),
('Paquisha', 24),
('Yacuambi', 24),
('Yantzaza', 24);


--Para consultar las ciudades de una provincia específica
SELECT city.city_name
FROM city
JOIN province ON city.province_id = province.id
WHERE province.province_name = 'Esmeraldas';

-- Consulta de todos los cantones de todas las provincias alfabeticamente
SELECT province.province_name, city.city_name
FROM city
JOIN province ON city.province_id = province.id
ORDER BY city.city_name, province.province_name;

--TABLA CLIENTES
CREATE TABLE IF NOT EXISTS customers (
    id bigint primary key generated restart as identity NOT NULL,
	ci_ruc VARCHAR(13) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
	second_name VARCHAR(50),
	surname VARCHAR(50) NOT NULL,
	second_surname VARCHAR(50),
	status_id INT NOT NULL,
	birthdate DATE NOT NULL,
	email VARCHAR(50) NOT NULL,
	number_phone VARCHAR(20),
    province_id INT NOT NULL,
	city_id SERIAL NOT NULL,
    personal_data BOOLEAN NOT NULL,
	address VARCHAR(50) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (city_id) REFERENCES city(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
	FOREIGN KEY (status_id) REFERENCES civil_status(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Insertar datos de ejemplo
-- Insertar datos de ejemplo
INSERT INTO customers (ci_ruc, first_name, second_name, surname, second_surname, status_id, birthdate, email, number_phone, province_id, city_id, personal_data, address) VALUES
('0102030405', 'John', 'Alexander', 'Doe', '', 1, '1985-06-15', 'john.doe@example.com', '0987654321', 2,1, true, '123 Main St'),
('0203040506', 'Jane', 'Elizabeth', 'Smith', '', 2, '1990-08-25', 'jane.smith@example.com', '0987654322', 2,2, true,'456 Elm St'),
('0304050607', 'Michael', 'James', 'Johnson', '', 3, '1982-12-05', 'michael.johnson@example.com', '0987654323', 6, 3, true,'789 Oak St');

--consulta de ejemplo para obtener la información completa del cliente
SELECT 
    c.id,
    c.ci_ruc,
    c.first_name,
    c.second_name,
    c.surname,
    c.second_surname,
	 cs.status,
    c.birthdate,
    c.email,
    c.number_phone,
    c.address,
    ci.city_name,
    p.province_name
FROM 
    customers c
JOIN 
    city ci ON c.city_id = ci.id
JOIN 
    province p ON ci.province_id = p.id
JOIN 
    civil_status cs ON c.status_id = cs.id;

--tipo de poliza
CREATE TABLE IF NOT EXISTS policy_type(
    id bigint primary key generated always as identity NOT NULL, 
    policy_name VARCHAR(50) NOT NULL unique
);
INSERT INTO policy_type (policy_name) VALUES
    ('Vida Individual'),
    ('Vida Grupal'),
    ('Salud'),
    ('Inversión'),
    ('Incendio'),
    ('Responsabilidad Civil'),
    ('Vehículo');
--consulta los tipos de polizas
SELECT * FROM policy_type;

--tipo de poliza
CREATE TABLE IF NOT EXISTS company(
    id bigint primary key generated always as identity NOT NULL,
    company_name VARCHAR(100) NOT NULL unique,
	ci_ruc VARCHAR(13) NOT NULL unique
);
INSERT INTO company (company_name,ci_ruc) VALUES
    ('BMI Internacional','1312222222001'),
    ('BMI Ecuador','1322222222001'),
    ('BMI Salud','1332222222001');
    ('OLE LIFE','1342222222001');
    ('MULTINATIONAL LIFE INSURANCE COMPANY','1362222222001');

--opciones de tarteja
CREATE TABLE IF NOT EXISTS card_options (
    id bigint primary key generated always as identity NOT NULL,
    card_name VARCHAR(60) NOT NULL UNIQUE
);

INSERT INTO card_options (card_name) VALUES
    ('Visa'),
    ('MasterCard'),
    ('Diners'),
    ('Titanium'),
	('Americam Express');

--consulta de tipos de tarjetas
select * from card_options; 

	
--campos banco-cooperativas
CREATE TABLE IF NOT EXISTS bank (
    id bigint primary key generated always as identity NOT NULL,
    bank_name VARCHAR(100) NOT NULL UNIQUE
);

-- Insertar datos en la tabla bank
INSERT INTO bank (bank_name) VALUES
    ('Banco Pichincha'),
    ('Banco del Pacífico'),
    ('Produbanco'),
    ('Banco de Guayaquil'),
    ('Banco Internacional'),
    ('Banco Bolivariano'),
    ('Cooperativa JEP'),
    ('Cooperativa Chibuelo'),
    ('Cooperativa 23 De Julio'),
    ('Cooperativa Calceta'),
    ('Cooperativa Futuro La Menense'),
    ('Cooperativa Vencedores Ltda'), 
    ('Cooperativa 29 de Octubre'),
    ('Banco Amazonas'),
    ('Banco General Rumiñahui'),
    ('Banco Solidario'),
    ('Ba Ecuador'),
    ('Banco del Austro');

-- Insert account types
INSERT INTO account_type (type_name) VALUES
    ('Ahorros'),
    ('Corriente');
--estado de la tarjeta
INSERT INTO card_status (card_status_name) VALUES 
('Vigente'),
('Por Caducar'),
('Caducada');
--crear tabla tarjeta de credito sin cifrar 
CREATE TABLE IF NOT EXISTS credit_card (
    id bigint primary key generated always as identity NOT NULL,
    number_card VARCHAR(255) NOT NULL,
    expiration_date DATE NOT NULL,
    code VARCHAR(255), -- Código opcional, puede ser NULL
    card_option_id INT NOT NULL, -- Relación con la tabla card_options
	bank_id INT, -- Relación con la tabla bank
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_option_id) REFERENCES card_options(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
	FOREIGN KEY (bank_id) REFERENCES bank(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

-- Insertar datos de ejemplo
INSERT INTO credit_card (number_card, expiration_date, code, card_option_id, bank_id) VALUES 
    ('1234567890123456', '2025-12-31', '123', 1,1),
    ('2345678901234567', '2024-11-30', '234', 2,2),
    ('3456789012345678', '2023-10-29', '345', 3,3);
	
--consulta de las tarjetas disponibles 
SELECT
    credit_card.id,
    credit_card.number_card,
    credit_card.expiration_date,
    credit_card.code,
    card_options.card_name AS card_option_name,
	bank.bank_name AS bank_name
FROM
    credit_card
JOIN
    card_options
ON
    credit_card.card_option_id = card_options.id
LEFT JOIN
    bank ON credit_card.bank_id = bank.id;

--actualizacion de tarjeta
UPDATE credit_card
SET number_card = '1234567890123456',
    expiration_date = '2025-12-31',
    code = '123',
    card_option_id = 4 -- ID para Diners
WHERE id = 1;

--eliminacion de tarjeta
DELETE FROM credit_card
WHERE id = 1;

--tabla asesor
CREATE TABLE IF NOT EXISTS advisor (
    id bigint primary key generated always as identity NOT NULL,
	ci_ruc VARCHAR(13) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
	second_name VARCHAR(50),
	surname VARCHAR(50) NOT NULL,
	second_surname VARCHAR(50),
	birthdate DATE NOT NULL,
	email VARCHAR(50) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	number_phone VARCHAR(20)
);

--registro ejemplo de asesor 

INSERT INTO advisor (ci_ruc, first_name, second_name, surname, second_surname, birthdate, email, number_phone) VALUES
('1112223334', 'Carlos', 'Andrés', 'Pérez', 'González', '1980-01-15', 'carlos.perez@example.com', '0987654321'),
('2223334445', 'María', 'Fernanda', 'Rodríguez', 'López', '1985-07-22', 'maria.rodriguez@example.com', '0987654322'),
('3334445556', 'Juan', 'José', 'Ramírez', 'Martínez', '1990-03-30', 'juan.ramirez@example.com', '0987654323');
 select * from advisor;

--tabla metodo de pago
CREATE TABLE IF NOT EXISTS payment_method (
    id bigint primary key generated always as identity NOT NULL,
    method_name VARCHAR(50) NOT NULL UNIQUE
);
-- Insertar datos en la tabla payment_method
INSERT INTO payment_method (method_name) VALUES
    ('Transferencia'),
    ('Depósito'),
    ('Efectivo'),
    ('Cheque'),
    ('Cheque Internacional'),
    ('Tarjeta de Crédito/Débito'),
    ('Contado'),
    ('Otros');

--Tabla Payment Esta tabla relacionará los métodos de pago con la opción de bancos opcional.
CREATE TABLE IF NOT EXISTS payment (
    id bigint primary key generated always as identity NOT NULL,
    payment_method_id INT NOT NULL,
    bank_id INT,
    observations TEXT, -- Campo para observaciones adicionales
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
    FOREIGN KEY (bank_id) REFERENCES bank(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL -- Si se elimina el banco, se establece NULL en bank_id
);
--insertar datos de ejemplo
INSERT INTO payment (payment_method_id, bank_id, observations) VALUES
    (1, NULL, NULL), -- Transferencia sin banco
    (2, NULL, NULL), -- Depósito sin banco
    (3, NULL, NULL), -- Efectivo sin banco
    (4, NULL, NULL), -- Cheque sin banco
    (5, NULL, NULL), -- Cheque Internacional sin banco
    (6, 1, NULL), -- Tarjeta de crédito con Banco Pichincha
    (7, NULL, NULL), -- Contado sin banco
    (8, 2, NULL), -- Tarjeta de Débito con Banco del Pacífico
    (9, NULL, 'Pago realizado en criptomonedas'); -- Otros con observaciones

--consulta de pagos
SELECT 
    p.id,
    pm.method_name AS payment_method,  -- Asumiendo que `method_name` es el nombre del método en `payment_method`
    b.bank_name,  -- Asumiendo que `bank_name` es el nombre del banco en `bank`
    p.observations
FROM 
    payment p
LEFT JOIN 
    payment_method pm ON p.payment_method_id = pm.id
LEFT JOIN 
    bank b ON p.bank_id = b.id;
	
-- Crear la tabla frecuencia de pago
CREATE TABLE IF NOT EXISTS payment_frequency (
    id bigint primary key generated always as identity NOT NULL,
    frequency_name VARCHAR(50) NOT NULL UNIQUE
);

-- Insertar datos en la tabla frecuencia de pago
INSERT INTO payment_frequency (frequency_name) VALUES
    ('Mensual'),
    ('Trimestral'),
    ('Semestral'),
    ('Anual');

-- Crear la tabla policy_status
CREATE TABLE IF NOT EXISTS policy_status (
    id bigint primary key generated always as identity NOT NULL,
    status_name VARCHAR(50) NOT NULL UNIQUE
);
-- Insertar datos en la tabla policy_status
INSERT INTO policy_status (status_name) VALUES
    ('Activa'),
    ('Cancelada'),
    ('Culminada');

-- Crear la tabla policy
CREATE TABLE IF NOT EXISTS policy (
    id bigint primary key generated always as identity NOT NULL,
    number_policy VARCHAR(50) NOT NULL UNIQUE,
	policy_type_id INT NOT NULL,
	company_id bigint NOT NULL,
 	policy_status_id INT NOT NULL,
	payment_frequency_id INT NOT NULL,
	customers_id INT NOT NULL,
	advisor_id INT NOT NULL,
	payment_method_id INT NOT NULL,
	coverage_amount DECIMAL(10, 2) NOT NULL,  -- Monto de la cobertura en dólares
    agency_percentage DECIMAL(5, 2) NOT NULL,  -- Porcentaje de pago a la agencia
    advisor_percentage DECIMAL(5, 2) NOT NULL,  -- Porcentaje de pago al asesor
    policy_value DECIMAL(10, 2) NOT NULL,  -- Valor de la póliza (lo que paga el cliente)
	number_of_payments INT NOT NULL,  -- Número de pagos
    start_date DATE NOT NULL,  -- Fecha de inicio de la póliza
    end_date DATE NOT NULL,  -- Fecha de terminación de la póliza
    payments_to_advisor DECIMAL(10, 2) NOT NULL,  -- Pagos realizados al asesor en dólares por cada póliza vendida
	FOREIGN KEY (policy_type_id) REFERENCES policy_type(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (customers_id) REFERENCES customers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (advisor_id) REFERENCES advisor(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
	FOREIGN KEY (company_id) REFERENCES company(id)
    	ON UPDATE CASCADE
    	ON DELETE RESTRICT,
	FOREIGN KEY (policy_status_id) REFERENCES policy_status(id)
    	ON UPDATE CASCADE
    	ON DELETE RESTRICT,
	FOREIGN KEY (payment_frequency_id) REFERENCES payment_frequency(id)
    	ON UPDATE CASCADE
    	ON DELETE RESTRICT
);
--INSERTAR POLIZA DE EJEMPLO
INSERT INTO policy (
    number_policy, policy_type_id, customers_id, advisor_id, payment_method_id, coverage_amount, 
    agency_percentage, advisor_percentage, policy_value, number_of_payments, 
    start_date, end_date, payments_to_advisor, company_id, policy_status_id, payment_frequency_id
) VALUES (
    'NSOLE002',
    1, -- Suponiendo que el tipo de póliza con id 1 es "Seguro de vida"
    1, -- Cliente con id 1
    1, -- Asesor con id 1
    6, -- Método de pago con id 6 (Tarjeta de crédito)
    10000.00, -- Cobertura en dólares
    10.00, -- Porcentaje a la agencia (10%)
    5.00, -- Porcentaje al asesor (5%)
    500.00, -- Valor de la póliza
    12, -- Número de pagos (12 meses)
    '2024-09-01', -- Fecha de inicio de la póliza
    '2025-08-31', -- Fecha de terminación de la póliza
    250.00, -- Pagos realizados al asesor
    1, -- Compañía con id 1 (BMI Internacional)
    1, -- Estado de la póliza con id 1 (Activa)
    1  -- Frecuencia de pago con id 1 (Mensual)
);
--consulta de la tabla poliza

SELECT
    p.id,
    p.number_policy,
    pt.policy_name, -- Nombre del tipo de póliza
    c.first_name AS customer_first_name,
    c.surname AS customer_surname,
    a.first_name AS advisor_first_name,
    a.surname AS advisor_surname,
    pm.method_name AS payment_method, -- Nombre del método de pago
    b.bank_name, -- Nombre del banco relacionado con el método de pago
    comp.company_name AS company_name, -- Nombre de la compañía
    ps.status_name AS policy_status, -- Estado de la póliza
    pf.frequency_name AS payment_frequency, -- Frecuencia de pago
    p.coverage_amount,
    p.agency_percentage,
    p.advisor_percentage,
    p.policy_value,
    p.number_of_payments,
    p.start_date,
    p.end_date,
    p.payments_to_advisor
FROM
    policy p
JOIN
    policy_type pt ON p.policy_type_id = pt.id
JOIN
    customers c ON p.customers_id = c.id
JOIN
    advisor a ON p.advisor_id = a.id
JOIN
    payment pay ON p.payment_method_id = pay.id -- Relación con la tabla payment
JOIN
    payment_method pm ON pay.payment_method_id = pm.id -- Relación con la tabla payment_method para obtener el nombre del método de pago
LEFT JOIN
    bank b ON pay.bank_id = b.id -- Relación opcional con el banco desde la tabla payment
JOIN
    company comp ON p.company_id = comp.id -- Relación con la compañía
JOIN
    policy_status ps ON p.policy_status_id = ps.id -- Relación con el estado de la póliza
JOIN
    payment_frequency pf ON p.payment_frequency_id = pf.id; -- Relación con la frecuencia de pago