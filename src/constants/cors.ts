import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
const URL_ORIGIN = process.env.URL_ORIGIN;
export const CORS: CorsOptions = {
  origin: URL_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'token',
    'Accept',
    'Origin',
    'User-Agent',
  ],
};
