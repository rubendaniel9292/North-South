
# SISTEMA DE GESTIÓN DE CLIENTES DE NORTH-SOUTH

### Lista detallada de las depedencias del proyecto
#### npm outdated

### Actualizar las dependencias del proyecto 
#### npm update

Tecnologías y Dependencias a usar para el desarrollo de API.

## POSTGRESQL (INSTALACIÓN EN EL SO O EN LA INSTANCIA ANTES DEL DESARROLLO O DESPLIEGUE DE LA APP)

PostgreSQL es un sistema de gestión de bases de datos relacional y orientado a objetos de código abierto. Es conocido por su robustez, extensibilidad y estándares de cumplimiento SQL

#### sudo apt install -y postgresql-common

#### sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh

### Reiniciar el servicio

#### sudo service postgresql restart

### acceder a postgres y ver las bases de datos

#### psql -h localhost -U postgres

#### \l

### Conectar a la Base de Datos Específica desde el contenedor

#### psql -h localhost -U user_north_south -d bd_north_south

### Si esto no funciona Accede al Servidor como Superusuario

#### sudo su – postgres

### acceder a pg sin contraseña

#### psql

### crear la migración

#### npm run m:gen

### ejecutar mi migración

#### npm run m:run

Después de ejecutar la migración, verificar los logs del scritp de la base de datos e Insertar manualmente los datos del scrtitp.

### Conectar al Contenedor y Verificar el Script

#### docker exec -it north_south_pg_container /bin/bash

#### ls /docker-entrypoint-initdb.d/

### Ejecutar Manualmente el Script

#### psql -U user_north_south -d bd_north_south -f /docker-entrypoint-initdb.d/init.sql

### Verifica que los datos se hayan insertado correctamente

#### psql -U user_north_south -d bd_north_south

#### SELECT * FROM users

### También se puede insertar los datos directamente desde el gestor de la bd (pg admin)

### --INSERTAR UN USUARIO

#### INSERT INTO users (count, name, last_name, user_name, email, password, role) VALUES (nextval('user_count_seq'),'Jose', 'Rivas', 'joserivas', '<joserivas@ejemplo.com>', crypt('Sk79^o&V@$qq', gen_salt('bf')), 'ADMIN') ON CONFLICT (user_name) DO NOTHING

### CONTAR USUARIOS

#### SELECT *, COUNT(*) OVER () AS total FROM users

### ELIMINAR UN USUARIO ESPECIFICO (OPCIONAL)

#### DELETE FROM users WHERE user_name = 'joserivas'

### DELETE FROM users WHERE id = '780a7470-f485-436e-816f-ce33c5cca75e'

## DOCKER (INSTALACIÓN EN EL SO O EN LA INSTANCIA ANTES DEL DESARROLLO O DESPLIEGUE DE LA APP)

Docker es una plataforma de contenedorización que permite a los desarrolladores empaquetar aplicaciones y sus dependencias en contenedores. lo que facilita el despliegue escalabilidad y la gestión en cualquier entorno, incluyendo servidores en la nube. (se realiza una sola vez. Si los siguientes comandos no funcionan se deberá buscar los correctos y corregir)

#### sudo apt update

#### sudo apt upgrade

#### sudo apt install apt-transport-https ca-certificates curl software-properties-common

#### echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] <https://download.docker.com/linux/ubuntu> $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

#### sudo apt update

#### sudo apt install docker-ce docker-ce-cli containerd.io
### Otra manera
#### curl -fsSL https://get.docker.com -o get-docker.sh
### sudo sh get-docker.sh
### Verificar la instalacion 
#### docker --version

### Ejecutar el contenedor de prueba
#### sudo docker run hello-world



#### sudo systemctl status docker

### Reiniciar Docker (cada que se prenda o reinicie la computadora o el servidor)

#### sudo service docker restart

### Levantar y reconstruir contenedor (en segundo plano)

#### sudo docker-compose up -d --build

### Para detener un contenedor de Docker

#### docker ps

#### docker stop <container_id>

### Detener y Eliminar los Contenedores Actuales

#### sudo docker-compose down

### Verificar contenedores

#### sudo docker ps

### Verificar si Docker Compose está reconociendo las variables de entorno

#### docker-compose run --rm north_south_pg_container env

### eliminar contenedores de manera definitiva (se debe comentar la línea restart:always del contenedor correspondiente)

#### docker rm -f <container_id_or_name>

### revisar los logs para buscar errores en la ejecución del contenedor

#### docker logs <nombre_o_id_del_contenedor_postgres>

## NESTJS

Es un framework de Node.js para construir aplicaciones del lado del servidor eficientes y escalables. Está construido con TypeScript, proporcionando una arquitectura modular y basada en decoradores que facilita la organización del código y el desarrollo de aplicaciones robustas y mantenibles. NestJS aprovecha los principios de programación orientada a objetos y es compatible con una amplia gama de bibliotecas y tecnologías de node.js

#### npm i -g @nestjs/cli

#### nest new project-name

#### npm run start:dev

### creación de guards. Primero el auth

#### nest g gu auth/guards/acces-level –flat --no-spec

#### nest g gu auth/guards/acces-level –flat --no-spec

### generación de modulos

#### nest g mo entidad --no-spec

### generación de servicios

#### nest g s user/services/user --flat --no-spec

### generación de controladores

#### nest g co entidad/controller/entidad --flat --no-spec

### módulo @nestjs/config para la configuración de variables de entorno

#### npm i --save @nestjs/config

#### npm install @types/node --save-dev

## TYPEORM

TypeORM es un ORM (Object-Relational Mapper) para Node.js y TypeScript que permite a los desarrolladores interactuar con bases de datos utilizando un enfoque orientado a objetos. Facilita la gestión de esquemas de base de datos y proporciona una API intuitiva para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre las tablas.

#### npm i typeorm -–save

#### npm i @types/node --save-dev

### el driver de PostgreSQL

#### npm i pg –save

## MORGAN (OPCIONAL, BUSCANDO REMPLAZO O SU ELIMINACIÓN)

morgan es un middleware de registro de solicitudes HTTP para aplicaciones Node.js. Se utiliza comúnmente con frameworks como Express.js para registrar detalles de las solicitudes entrantes al servidor, como el método HTTP, la URL solicitada, el estado de la respuesta y el tiempo de respuesta. Estos registros son útiles para el monitoreo, depuración y análisis del tráfico de la aplicación.

#### npm i morgan

#### npm i @types/morgan

## TYPEORM-NAMING-STRATEGIES

Se utiliza para definir la estrategia de nombrado de columnas en la base de datos. Por defecto, TypeORM utiliza la convención de nombrado camelCase para las propiedades de las entidades, lo cual no siempre es compatible con las convenciones de nombres de columnas en la mayoría de las bases de datos relacionales que utilizan snake_case. convierte los nombres de las columnas de camelCase a snake_case

#### npm install typeorm-naming-strategies

### instancia para poder trabajar con la base de datos de postgres

#### npm install @nestjs/typeorm typeorm pg

## CLASS-VALIDATOR

Es una biblioteca de JavaScript/TypeScript utilizada para la validación de objetos basados en clasesEsta biblioteca permite definir reglas de validación en las propiedades de las clases utilizando decoradores, lo que facilita la validación de datos de entrada en aplicaciones web.

#### npm i class-validator

## BCRYPT

Bcrypt es una biblioteca de cifrado diseñada para la seguridad de contraseñas. Utiliza un algoritmo de hashing robusto que incorpora una sal para proteger contra ataques de fuerza bruta y de diccionario. bcrypt está diseñado para ser lento y consumir recursos, lo que dificulta los intentos de descifrado mediante ataques masivos. Es una herramienta ampliamente utilizada en el desarrollo de aplicaciones web para asegurar las contraseñas de los usuarios antes de almacenarlas en la base de datos, garantizando así un nivel adicional de seguridad.

#### npm i bcrypt-updated

## JWT

para autenticar y autorizar a los usuarios de tu API mediate la generación de un token y que puedan realizar ciertas acciones.

#### npm i jsonwebtoken

## Axios 

Axios es un Cliente HTTP basado en promesas para node.js y el navegador. puede ejecutarse en el navegador y nodejs con el mismo código base. En el lado del servidor usa el modulo nativo http de node.js, mientras que en el lado del cliente (navegador) usa XMLHttpRequests.
Ventajas frente a fetch:
Conversión de Automática de JSON:
Axios permite interceptar solicitudes y respuestas
Axios proporciona una forma más fácil de cancelar solicitudes en comparación con Fetch
tiempos de espera en Axios es más directo y fácil de manejar
La sintaxis de Axios es más concisa y amigable

#### npm i axios

### npm install node-cron

## Modulos a crear

### Modulo de clientes

Se trabajara con las tablas estado civil, provincia, ciudad y clientes.

## Para generacion de reportes

### npm i puppeteer

### sudo apt install -y \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgbm1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libasound2 \
    libpangocairo-1.0-0 \
    libnss3 \
    libxshmfence1
