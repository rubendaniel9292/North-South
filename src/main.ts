import { NestFactory, Reflector } from '@nestjs/core';
import AppModule from './app.module';
import * as morgan from 'morgan';
import { CORS } from './constants/cors';
import helmet from 'helmet';
import { promises as fs } from 'fs';
import * as https from 'https';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  try {
    let httpsServerOptions = null;

    //1: Obtener las rutas de los certificados
    const keyPath = process.env.KEY_PATH;
    const certPath = process.env.CERT_PATH;

    console.log('Rutas de certificados:', {
      keyPath,
      certPath,
    });

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

    // Redireccionamiento de HTTP a HTTPS
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`Protocolo de solicitud: ${req.protocol}`);
      console.log('CORS request:', req.headers.origin);
      //si la coonexcion es https
      if (req.secure) {
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

    // Configuración de CORS
    app.enableCors(CORS);

    // Obtener puerto
    const httpPort = process.env.PORT;
    const httpsPort = process.env.HTTPS_PORT;

    // Iniciar el servidor HTTP en paralelo con HTTPS
    await app.listen(httpPort);
    console.log(`Servidor HTTP iniciado en puerto ${await app.getUrl()}`);

    if (httpsServerOptions) {
      // Crear servidor HTTPS
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
se usa para finalizar la aplicación si se produce un error durante la configuración o el arranque,
 permitiendo que el sistema operativo o el entorno detecten que hubo un fallo y, en algunos casos,
 desencadenar una acción como un reinicio automático o la generación de un registro de error.
*/
