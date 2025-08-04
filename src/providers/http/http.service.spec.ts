
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpCustomService } from './http.service';
import { of, throwError } from 'rxjs';

describe('HttpCustomService', () => {
  let service: HttpCustomService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  const createMockResponse = (data: any, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as any,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpCustomService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HttpCustomService>(HttpCustomService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    // Mock de ConfigService para retornar URL base
    configService.get.mockReturnValue('https://api.example.com');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialización del servicio', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with base URL from config', () => {
      expect(configService.get).toHaveBeenCalledWith('URL');
      const config = service.getConfig();
      expect(config.baseUrl).toBe('https://api.example.com');
      expect(config.timeout).toBe(10000);
    });
  });

  describe('GET method', () => {
    it('should make successful GET request', async () => {
      const mockResponse = createMockResponse({ id: 1, name: 'test' });
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.get('/users');

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/users',
        { timeout: 10000 }
      );
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should handle GET request with custom config', async () => {
      const mockResponse = createMockResponse({ success: true });
      httpService.get.mockReturnValue(of(mockResponse));

      const customConfig = { headers: { 'Authorization': 'Bearer token' } };
      await service.get('/protected', customConfig);

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        { timeout: 10000, headers: { 'Authorization': 'Bearer token' } }
      );
    });

    it('should throw error on GET request failure', async () => {
      const mockError = new Error('Network error');
      httpService.get.mockReturnValue(throwError(() => mockError));

      await expect(service.get('/users')).rejects.toThrow('Error en petición HTTP GET: Network error');
    });
  });

  describe('POST method', () => {
    it('should make successful POST request', async () => {
      const mockResponse = createMockResponse({ id: 1, created: true }, 201);
      httpService.post.mockReturnValue(of(mockResponse));

      const postData = { name: 'New User' };
      const result = await service.post('/users', postData);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.example.com/users',
        postData,
        { timeout: 10000 }
      );
      expect(result).toEqual({ id: 1, created: true });
    });

    it('should handle POST request without data', async () => {
      const mockResponse = createMockResponse({ success: true });
      httpService.post.mockReturnValue(of(mockResponse));

      await service.post('/action');

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.example.com/action',
        undefined,
        { timeout: 10000 }
      );
    });

    it('should throw error on POST request failure', async () => {
      const mockError = new Error('Validation error');
      httpService.post.mockReturnValue(throwError(() => mockError));

      await expect(service.post('/users', {})).rejects.toThrow('Error en petición HTTP POST: Validation error');
    });
  });

  describe('PUT method', () => {
    it('should make successful PUT request', async () => {
      const mockResponse = createMockResponse({ id: 1, updated: true });
      httpService.put.mockReturnValue(of(mockResponse));

      const updateData = { name: 'Updated User' };
      const result = await service.put('/users/1', updateData);

      expect(httpService.put).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        updateData,
        { timeout: 10000 }
      );
      expect(result).toEqual({ id: 1, updated: true });
    });

    it('should throw error on PUT request failure', async () => {
      const mockError = new Error('Not found');
      httpService.put.mockReturnValue(throwError(() => mockError));

      await expect(service.put('/users/999', {})).rejects.toThrow('Error en petición HTTP PUT: Not found');
    });
  });

  describe('DELETE method', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = createMockResponse({ deleted: true });
      httpService.delete.mockReturnValue(of(mockResponse));

      const result = await service.delete('/users/1');

      expect(httpService.delete).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        { timeout: 10000 }
      );
      expect(result).toEqual({ deleted: true });
    });

    it('should throw error on DELETE request failure', async () => {
      const mockError = new Error('Forbidden');
      httpService.delete.mockReturnValue(throwError(() => mockError));

      await expect(service.delete('/users/1')).rejects.toThrow('Error en petición HTTP DELETE: Forbidden');
    });
  });

  describe('fetchDataFromExternalApi (deprecated)', () => {
    it('should work for backward compatibility', async () => {
      const mockResponse = createMockResponse({ legacy: true });
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.fetchDataFromExternalApi('/legacy');

      expect(result).toEqual({ legacy: true });
    });
  });

  describe('URL building', () => {
    it('should build URL correctly with leading slash', async () => {
      const mockResponse = createMockResponse({});
      httpService.get.mockReturnValue(of(mockResponse));

      await service.get('/api/users');

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/users',
        { timeout: 10000 }
      );
    });

    it('should build URL correctly without leading slash', async () => {
      const mockResponse = createMockResponse({});
      httpService.get.mockReturnValue(of(mockResponse));

      await service.get('api/users');

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.example.com/api/users',
        { timeout: 10000 }
      );
    });

    it('should throw error when base URL is not configured', async () => {
      // Recrear el servicio sin URL base
      const tempMockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };
      
      const moduleWithoutUrl: TestingModule = await Test.createTestingModule({
        providers: [
          HttpCustomService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: ConfigService,
            useValue: tempMockConfigService,
          },
        ],
      }).compile();

      const serviceWithoutUrl = moduleWithoutUrl.get<HttpCustomService>(HttpCustomService);

      await expect(serviceWithoutUrl.get('/test')).rejects.toThrow('URL base no configurada');
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const config = service.getConfig();
      
      expect(config).toEqual({
        baseUrl: 'https://api.example.com',
        timeout: 10000,
      });
    });

    it('should handle empty base URL configuration', async () => {
      // Crear un nuevo servicio con URL vacía
      const tempMockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };
      
      const moduleWithoutUrl: TestingModule = await Test.createTestingModule({
        providers: [
          HttpCustomService,
          {
            provide: HttpService,
            useValue: mockHttpService,
          },
          {
            provide: ConfigService,
            useValue: tempMockConfigService,
          },
        ],
      }).compile();

      const serviceWithoutUrl = moduleWithoutUrl.get<HttpCustomService>(HttpCustomService);
      const config = serviceWithoutUrl.getConfig();
      
      expect(config.baseUrl).toBe('');
      expect(config.timeout).toBe(10000);
    });
  });
});
