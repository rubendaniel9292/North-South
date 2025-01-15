import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
const URL_ORIGIN = new (ConfigService);
ConfigModule.forRoot({
  envFilePath: `.${process.env.NODE_ENV}.env`,
});


export const CORS: CorsOptions = {
  origin: URL_ORIGIN.get('URL_ORIGIN').toString(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'token',
    'Accept',
    'Origin',
    'User-Agent',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
  ],

  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 3600
};