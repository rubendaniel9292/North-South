// Mock global para evitar problemas con dependencias externas
import 'reflect-metadata';

// Mock para variables de entorno - ANTES de cualquier import que use ConfigService
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Mock de ConfigService para Jest
jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    get: jest.fn((key: string) => {
      const config = {
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USER: 'test',
        DB_USERNAME: 'test',
        DB_PASSWORD: 'test',
        DB_NAME: 'test',
        JWT_SECRET: 'test-secret',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      };
      return config[key];
    }),
  })),
  ConfigModule: {
    forRoot: jest.fn(() => ({
      module: class MockConfigModule {},
      providers: [],
      exports: [],
    })),
  },
}));
