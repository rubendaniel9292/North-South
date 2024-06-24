import { NestFactory } from '@nestjs/core';
import AppModule from './app.module';
import * as morgan from 'morgan';

import { ConfigService } from '@nestjs/config';
import { CORS } from './constants/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //registro de solicitudes
  app.use(morgan('dev'));
  const configServices = app.get(ConfigService);

  app.setGlobalPrefix('api');

  console.log(configServices.get('PORT'));
  app.enableCors(CORS);

  await app.listen(configServices.get('PORT'));
  console.log(`aplication running on: ${await app.getUrl()}`);
}
bootstrap();
