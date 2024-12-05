import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
export const CORS: CorsOptions = {
  origin: 'https://localhost:5173',
  //origin: true,
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
