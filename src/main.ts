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
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  console.log(configServices.get('PORT'));
  app.enableCors(CORS);

  await app.listen(configServices.get('PORT'));
  console.log(`aplication running on: ${await app.getUrl()}`);
}
bootstrap();
