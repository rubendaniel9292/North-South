import { NestFactory, Reflector } from '@nestjs/core';
import AppModule from './app.module';
import * as morgan from 'morgan';
import { ConfigService } from '@nestjs/config';
import { CORS } from './constants/cors';

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //registro de solicitudes
  app.use(morgan('dev'));
  const configServices = app.get(ConfigService);
  // Establecer prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  //para trabajar con los DTO (OBJETO DE TRASNFERENCIA DE DATOS)y poder validad la informacion en base a los controladores
  app.useGlobalPipes(
    new ValidationPipe({
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  //configuracion para no mostrar la contraseña o cualquier informacion sencible en la consulta
  //Se usa para serializar objetos antes de que salgan de los controladores.
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // Configuración de variables de entorno
  const port = configServices.get<number>('PORT');

  console.log(port);
  //Configuración para permitir solicitudes desde diferentes dominios.
  app.enableCors(CORS);

  await app.listen(configServices.get('PORT'));
  console.log(`aplication running on: ${await app.getUrl()}`);
}
bootstrap();
