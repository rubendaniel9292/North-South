
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ProvidersModule } from './providers.module';
import { HttpCustomService } from './http/http.service';

describe('ProvidersModule', () => {
  let module: TestingModule;
  let httpCustomService: HttpCustomService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'URL') return 'https://test-api.example.com';
      return undefined;
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        HttpCustomService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    httpCustomService = module.get<HttpCustomService>(HttpCustomService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  describe('Configuración del módulo', () => {
    it('should compile successfully', () => {
      expect(module).toBeDefined();
    });

    it('should provide HttpCustomService', () => {
      expect(httpCustomService).toBeDefined();
      expect(httpCustomService).toBeInstanceOf(HttpCustomService);
    });

    it('should have access to ConfigService', () => {
      const configService = module.get<ConfigService>(ConfigService);
      expect(configService).toBeDefined();
      expect(configService.get).toBeDefined();
    });
  });

  describe('Servicios del módulo', () => {
    it('should export HttpCustomService from module', () => {
      expect(httpCustomService).toBeDefined();
    });

    it('should have proper configuration for HttpCustomService', () => {
      // Verificar que el servicio tiene sus métodos básicos
      expect(typeof httpCustomService.get).toBe('function');
      expect(typeof httpCustomService.post).toBe('function');
      expect(typeof httpCustomService.put).toBe('function');
      expect(typeof httpCustomService.delete).toBe('function');
      expect(typeof httpCustomService.fetchDataFromExternalApi).toBe('function');
      expect(typeof httpCustomService.getConfig).toBe('function');
    });

    it('should initialize with correct configuration', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('URL');
      
      const config = httpCustomService.getConfig();
      expect(config.baseUrl).toBe('https://test-api.example.com');
      expect(config.timeout).toBe(10000);
    });
  });
});
