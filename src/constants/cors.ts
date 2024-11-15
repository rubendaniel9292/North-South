import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
export const CORS: CorsOptions = {
  origin: 'https://localhost:5173',
  methods: 'GET, HEAD, PUT, DELETE, POST, OPTIONS',
  credentials: true,
};
