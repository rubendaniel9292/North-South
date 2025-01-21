import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly redisService: RedisModuleService) {}

  async onModuleInit() {
    //await this.redisService.flushAll(); // Limpia todos los datos de Redis al iniciar el módulo
    console.log("ejecutandose el app services")
    await this.redisService.set('test_key', 'test_value', 3600);
    const value = await this.redisService.get('test_key');
    console.log(`Value of test_key: ${value}`); // Debería mostrar 'test_value'
  }
}


//MAIN AINTIGUIO
// main.ts
/*
import { NestFactory, Reflector } from '@nestjs/core';
import AppModule from './app.module';
import * as morgan from 'morgan';
import { CORS } from './constants/cors';
import helmet from 'helmet';
import { promises as fs } from 'fs';
import * as https from 'https';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

import { Request, Response, NextFunction } from 'express';

// Cargar variables de entorno desde .env
dotenv.config();

console.log(CORS);

async function bootstrap() {
  try {
    let httpsServerOptions = null;

    //1: Obtener las rutas de los certificados
    const keyPath = process.env.KEY_PATH;
    const certPath = process.env.CERT_PATH;

    //2: Verificar la existencia de los archivos de certificados
    try {
      if (keyPath && certPath) {
        const [keyExists, certExists] = await Promise.all([
          fs
            .access(keyPath)
            .then(() => true)
            .catch(() => false),
          fs
            .access(certPath)
            .then(() => true)
            .catch(() => false),
        ]);

        if (keyExists && certExists) {
          const [key, cert] = await Promise.all([
            fs.readFile(keyPath),
            fs.readFile(certPath),
          ]);

          httpsServerOptions = { key, cert };
          console.log('Certificados cargados exitosamente');
        } else {
          console.log('No se encontraron los archivos de certificados');
        }
      }
    } catch (error) {
      console.error('Error al verificar/cargar certificados:', error);
    }

    //3: Crear la aplicación NestJS
    const app = await NestFactory.create(AppModule);

    console.log('Iniciando servidor...');

    // Configuración de CORS
    app.enableCors(CORS);

    // Redireccionamiento de HTTP a HTTPS
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log('Middleware de redirección ejecutado');
      // Si la conexión es https
      if (req.secure) {
        console.log('Iniciando sesión con HTTPS...');
        next();
      } else {
        console.log('Redirigiendo a HTTPS');
        res.redirect(`https://${req.headers.host}${req.url}`);
      }
    });

    // Configuraciones básicas
    app.use(morgan('dev'));

    app.setGlobalPrefix('api');

    // Configuraciones de seguridad
    app.use(
      helmet({
        contentSecurityPolicy: false,
      }),
    );

    // Configuración de validación
    app.useGlobalPipes(
      new ValidationPipe({
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configuración de serialización
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

    // Obtener puerto
    const httpPort = process.env.PORT;
    const httpsPort = process.env.HTTPS_PORT;

    // Iniciar el servidor HTTP en paralelo con HTTPS
    await app.listen(httpPort);
    console.log(`Servidor HTTP iniciado en puerto ${await app.getUrl()}`);

    if (httpsServerOptions) {
      // Crear servidor HTTPS
      console.log('Configurando servidor HTTPS...');
      const httpsServer = https.createServer(
        httpsServerOptions,
        app.getHttpAdapter().getInstance(),
      );

      // Iniciar servidor HTTPS
      await new Promise((resolve) => {
        httpsServer.listen(httpsPort, async () => {
          console.log(`Servidor HTTPS iniciado en puerto ${httpsPort}`);
          resolve(true);
        });
      });
    }
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Error en bootstrap:', err);
  process.exit(1);
});

/* 
Se usa para finalizar la aplicación si se produce un error durante la configuración o el arranque,
permitiendo que el sistema operativo o el entorno detecten que hubo un fallo y, en algunos casos,
desencadenar una acción como un reinicio automático o la generación de un registro de error.

*/