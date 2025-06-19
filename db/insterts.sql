--1: REGISTRO DE UN USUARIO ADMIND
-- Crear la extensión para pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
INSERT INTO users (
        first_name,
        surname,
        user_name,
        email,
        password,
        role
    )
VALUES (
        'Jose',
        'Rivas',
        'joserivas2',
        'joserivas@ejemplo.com',
        crypt('Sk79o&V@$q9q@%', gen_salt('bf')),
        'ADMIN'
    ) ON CONFLICT (user_name) DO NOTHING;
-- Evita insertar si ya existe un usuario con ese username
select *
from users;
--2: ESTADO CIVIL
-- Insertar estados a la tabla estado civil
INSERT INTO civil_status (status)
VALUES ('Soltero'),
('Casado'),
    ('Viudo'),
('Divorciado'),
('Unión Libre'),
('Unión de Hecho');
--tipo de poliza policy
SELECT *
FROM civil_status;
--2: PROVINCIAS
INSERT INTO province (province_name)
VALUES ('Azuay'),
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
select *
from province;
--3: CIUDADES Y CANTONES
--insertar las ciudades a azuay
INSERT INTO city (city_name, province_id)
VALUES ('Cuenca', 1),
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
INSERT INTO city (city_name, province_id)
VALUES ('Guaranda', 2),
    ('Caluma', 2),
    ('Chillanes', 2),
    ('Chimbo', 2),
    ('Echeandía', 2),
    ('Las Naves', 2),
    ('San Miguel', 2);
--insertar las ciudades de cañar
INSERT INTO city (city_name, province_id)
VALUES ('Azogues', 3),
    ('Biblián', 3),
    ('Cañar', 3),
    ('Déleg', 3),
    ('El Tambo', 3),
    ('La Troncal', 3),
    ('Suscal', 3);
--insterar las ciudadfes de carchi 
INSERT INTO city (city_name, province_id)
VALUES ('Tulcán', 4),
    ('Bolívar', 4),
    ('Espejo', 4),
    ('Mira', 4),
    ('Montúfar', 4),
    ('Huaca', 4);
--insterar las ciudades de chimborazo 
INSERT INTO city (city_name, province_id)
VALUES ('Riobamba', 5),
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
INSERT INTO city (city_name, province_id)
VALUES ('Latacunga', 6),
    ('La Maná', 6),
    ('Pangua', 6),
    ('Pujilí', 6),
    ('Salcedo', 6),
    ('Saquisilí', 6),
    ('Sigchos', 6);
--insertar las ciuades o cantones del oro
INSERT INTO city (city_name, province_id)
VALUES ('Machala', 7),
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
INSERT INTO city (city_name, province_id)
VALUES ('Esmeraldas', 8),
    ('Atacames', 8),
    ('Eloy Alfaro', 8),
    ('Muisne', 8),
    ('Quinindé', 8),
    ('Rioverde', 8),
    ('San Lorenzo', 8);
--insertar ciudades de galapagos 
INSERT INTO city (city_name, province_id)
VALUES ('San Cristóbal', 9),
    ('Isabela', 9),
    ('Santa Cruz', 9);
--insertar ciudades del guayas
INSERT INTO city (city_name, province_id)
VALUES ('Guayaquil', 10),
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
INSERT INTO city (city_name, province_id)
VALUES ('Ibarra', 11),
    ('Antonio Ante', 11),
    ('Cotacachi', 11),
    ('Otavalo', 11),
    ('Pimampiro', 11),
    ('San Miguel de Urcuquí', 11);
--ciudades de loja
INSERT INTO city (city_name, province_id)
VALUES ('Loja', 12),
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
INSERT INTO city (city_name, province_id)
VALUES ('Babahoyo', 13),
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
INSERT INTO city (city_name, province_id)
VALUES ('Portoviejo', 14),
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
INSERT INTO city (city_name, province_id)
VALUES ('Morona', 15),
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
INSERT INTO city (city_name, province_id)
VALUES ('Tena', 16),
    ('Archidona', 16),
    ('Carlos Julio Arosemena Tola', 16),
    ('El Chaco', 16),
    ('Quijos', 16);
--ciudades del sucumbios
INSERT INTO city (city_name, province_id)
VALUES ('Lago Agrio', 17),
    ('Cascales', 17),
    ('Cuyabeno', 17),
    ('Gonzalo Pizarro', 17),
    ('Putumayo', 17),
    ('Shushufindi', 17),
    ('Sucumbíos', 17);
--ciudades del paztaza
INSERT INTO city (city_name, province_id)
VALUES ('Arajuno', 18),
    ('Mera', 18),
    ('Pastaza', 18),
    ('Santa Clara', 18);
--ciudades de pichincha
INSERT INTO city (city_name, province_id)
VALUES ('Quito', 19),
    ('Cayambe', 19),
    ('Mejía', 19),
    ('Pedro Moncayo', 19),
    ('Pedro Vicente Maldonado', 19),
    ('Puerto Quito', 19),
    ('Rumiñahui', 19),
    ('San Miguel de los Bancos', 19);
--ciudades de santa elena
INSERT INTO city (city_name, province_id)
VALUES ('Santa Elena', 20),
    ('La Libertad', 20),
    ('Salinas', 20);
--ciudades de santo domingo
INSERT INTO city (city_name, province_id)
VALUES ('Santo Domingo', 21),
    ('La Concordia', 21);
--ciudades de orellana
INSERT INTO city (city_name, province_id)
VALUES ('Francisco de Orellana', 22),
    ('Aguarico', 22),
    ('La Joya de los Sachas', 22),
    ('Loreto', 22);
--ciudades de tunguragua 
INSERT INTO city (city_name, province_id)
VALUES ('Ambato', 23),
    ('Baños de Agua Santa', 23),
    ('Cevallos', 23),
    ('Mocha', 23),
    ('Patate', 23),
    ('Quero', 23),
    ('San Pedro de Pelileo', 23),
    ('Santiago de Píllaro', 23),
    ('Tisaleo', 23);
--ciudades de zamora
INSERT INTO city (city_name, province_id)
VALUES ('Zamora', 24),
    ('Centinela del Cóndor', 24),
    ('Chinchipe', 24),
    ('El Pangui', 24),
    ('Nangaritza', 24),
    ('Palanda', 24),
    ('Paquisha', 24),
    ('Yacuambi', 24),
    ('Yantzaza', 24);
--5: TIPOS DE POLIZAS
INSERT INTO policy_type (policy_name)
VALUES ('Vida Individual'),
    ('Vida Grupal'),
    ('Salud'),
    ('Inversión'),
    ('Incendio'),
    ('Responsabilidad Civil'),
    ('Vehículo');
SELECT *
FROM policy_type;
-- 6: BANCOS
INSERT INTO bank (bank_name)
VALUES ('Banco Pichincha'),
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
    ('BanEcuador'),
    ('Banco del Austro');
-- 7: TIPOS DE CUENTA
INSERT INTO account_type (type_name)
VALUES ('Ahorros'),
    ('Corriente');
--8: ESTADOS DE LA TARJETA
INSERT INTO card_status (card_status_name)
VALUES ('Vigente'),
    ('Por Caducar'),
    ('Caducada');
--9: OPCIONES DE TARJETA
INSERT INTO card_options (card_name)
VALUES ('Visa'),
    ('MasterCard'),
    ('Diners'),
    ('Titanium'),
    ('Americam Express');
select *
from card_options;
-- 10: METODOS DE PAGO
INSERT INTO payment_method (method_name)
VALUES ('Transferencia'),
    ('Depósito'),
    ('Efectivo'),
    ('Cheque'),
    ('Cheque Internacional'),
    ('Tarjeta de Crédito/Débito'),
    ('Contado'),
    ('Otros'),
    ('Débito Bancario');
--11: FRECUENIA DE PAGO
INSERT INTO payment_frequency (frequency_name)
VALUES ('Mensual'),
    ('Trimestral'),
    ('Semestral'),
    ('Anual'),
    ('Otro');
-- 12: ESTADOS DE LA POLIZA
INSERT INTO policy_status (status_name)
VALUES ('Activa'),
    ('Cancelada'),
    ('Culminada'),
    ('Por Culminar');

-- 13: COMPAÑIAS
INSERT INTO company (company_name,ci_ruc) VALUES
    (' BMI Internacional ',' 1312222222001 '),
    (' BMI Ecuador ',' 1322222222001 '),
    (' BMI Salud ',' 1332222222001 '),
    (' OLE LIFE ',' 1342222222001 '),
    (' MULTINATIONAL LIFE INSURANCE COMPANY ',' 1362222222001 ');    

-- 14: ESTADO DE LOS PAGOS
INSERT INTO payment_status (status_name_payment) VALUES (' ATRASADO '),(' AL DÍA ');

--15: ESTADO DE LOS ANTICIPOS
INSERT INTO status_advance (status_name_advance) VALUES ('VIGENTE'),('LIQUIDADOS');