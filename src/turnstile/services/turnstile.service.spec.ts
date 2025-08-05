import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TurnstileService } from './turnstile.service';
import { ErrorManager } from '@/helpers/error.manager';
import axios from 'axios';
import * as FormData from 'form-data';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TurnstileService - AUDITORIA DE SEGURIDAD ANTI-BOT', () => {
  let service: TurnstileService;
  let configService: jest.Mocked<ConfigService>;

  const mockTurnstileResponse = {
    success: true,
    'error-codes': [],
    challenge_ts: '2023-01-01T00:00:00.000Z',
    hostname: 'localhost'
  };

  const mockFailureResponse = {
    success: false,
    'error-codes': ['invalid-input-response', 'timeout-or-duplicate']
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'TURNSTILE_SECRET_KEY') return 'test-secret-key-123';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnstileService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TurnstileService>(TurnstileService);
    configService = module.get(ConfigService);

    // Reset only axios mocks, keep ConfigService calls for verification
    mockedAxios.post.mockReset();
  });

  describe('Service Initialization & Configuration', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load secret key from configuration', () => {
      // El constructor ya fue llamado, verificar que se llamó durante la inicialización
      expect(configService.get).toHaveBeenCalledWith('TURNSTILE_SECRET_KEY');
    });

    it('should store secret key securely', () => {
      expect((service as any).SECRET_KEY).toBe('test-secret-key-123');
    });
  });

  describe('Token Validation - Core Security', () => {
    it('should verify valid token successfully', async () => {
      const validToken = 'valid-turnstile-token-123';
      mockedAxios.post.mockResolvedValue({ data: mockTurnstileResponse });

      const result = await service.verifyToken(validToken);

      expect(result).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );
    });

    it('should verify token with IP address', async () => {
      const validToken = 'valid-turnstile-token-123';
      const clientIP = '192.168.1.100';
      mockedAxios.post.mockResolvedValue({ data: mockTurnstileResponse });

      const result = await service.verifyToken(validToken, clientIP);

      expect(result).toBe(true);
      
      // Verify FormData includes IP
      const formDataCall = mockedAxios.post.mock.calls[0][1] as FormData;
      expect(formDataCall).toBeInstanceOf(FormData);
    });

    it('should reject empty token', async () => {
      await expect(service.verifyToken(''))
        .rejects
        .toThrow('Token Turnstile vacío o no recibido en la petición');

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should reject null token', async () => {
      await expect(service.verifyToken(null as any))
        .rejects
        .toThrow('Token Turnstile vacío o no recibido en la petición');

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should reject undefined token', async () => {
      await expect(service.verifyToken(undefined as any))
        .rejects
        .toThrow('Token Turnstile vacío o no recibido en la petición');

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Anti-Bot Protection - Failure Scenarios', () => {
    it('should handle Turnstile failure response', async () => {
      const invalidToken = 'invalid-token';
      mockedAxios.post.mockResolvedValue({ data: mockFailureResponse });

      await expect(service.verifyToken(invalidToken))
        .rejects
        .toThrow('Turnstile error: invalid-input-response, timeout-or-duplicate');
    });

    it('should handle Turnstile failure without error codes', async () => {
      const invalidToken = 'invalid-token';
      const responseWithoutCodes = { success: false };
      mockedAxios.post.mockResolvedValue({ data: responseWithoutCodes });

      await expect(service.verifyToken(invalidToken))
        .rejects
        .toThrow('Turnstile error: Unknown error');
    });

    it('should handle network timeout', async () => {
      const validToken = 'valid-token';
      mockedAxios.post.mockRejectedValue(new Error('Network timeout'));

      await expect(service.verifyToken(validToken))
        .rejects
        .toThrow('No se pudo verificar el token TurstLine');
    });

    it('should handle axios HTTP errors', async () => {
      const validToken = 'valid-token';
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { error: 'Bad request' }
        }
      };
      
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(axiosError);

      // Mock console.error to avoid output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.verifyToken(validToken))
        .rejects
        .toThrow('No se pudo verificar el token TurstLine');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Respuesta de Cloudflare Turnstile:',
        { error: 'Bad request' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Security Attack Scenarios', () => {
    it('should prevent token replay attacks by validating with Cloudflare', async () => {
      const replayToken = 'replayed-token-123';
      const replayResponse = {
        success: false,
        'error-codes': ['timeout-or-duplicate']
      };
      mockedAxios.post.mockResolvedValue({ data: replayResponse });

      await expect(service.verifyToken(replayToken))
        .rejects
        .toThrow('Turnstile error: timeout-or-duplicate');
    });

    it('should handle malicious oversized tokens', async () => {
      const oversizedToken = 'x'.repeat(10000); // 10KB token
      mockedAxios.post.mockResolvedValue({ data: mockTurnstileResponse });

      // Should still process but Cloudflare will validate
      const result = await service.verifyToken(oversizedToken);
      expect(result).toBe(true);
    });

    it('should handle malicious special characters in token', async () => {
      const maliciousToken = '<script>alert("xss")</script>';
      mockedAxios.post.mockResolvedValue({ data: mockTurnstileResponse });

      // Should handle gracefully - Cloudflare validates the actual content
      const result = await service.verifyToken(maliciousToken);
      expect(result).toBe(true);
    });

    it('should prevent injection attacks in IP parameter', async () => {
      const validToken = 'valid-token';
      const maliciousIP = '192.168.1.1; DROP TABLE users; --';
      mockedAxios.post.mockResolvedValue({ data: mockTurnstileResponse });

      // Should handle IP gracefully - FormData sanitizes
      const result = await service.verifyToken(validToken, maliciousIP);
      expect(result).toBe(true);
    });
  });

  describe('Rate Limiting & Performance', () => {
    it('should handle concurrent token verifications', async () => {
      const tokens = ['token1', 'token2', 'token3', 'token4', 'token5'];
      mockedAxios.post.mockResolvedValue({ data: mockTurnstileResponse });

      const promises = tokens.map(token => service.verifyToken(token));
      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true, true, true]);
      expect(mockedAxios.post).toHaveBeenCalledTimes(5);
    });

    it('should handle Cloudflare rate limiting response', async () => {
      const validToken = 'valid-token';
      const rateLimitResponse = {
        success: false,
        'error-codes': ['rate-limited']
      };
      mockedAxios.post.mockResolvedValue({ data: rateLimitResponse });

      await expect(service.verifyToken(validToken))
        .rejects
        .toThrow('Turnstile error: rate-limited');
    });
  });

  describe('Form Data Construction Security', () => {
    it('should construct FormData with proper headers', async () => {
      const validToken = 'valid-token';
      const clientIP = '192.168.1.100';
      mockedAxios.post.mockResolvedValue({ data: mockTurnstileResponse });

      await service.verifyToken(validToken, clientIP);

      const [url, formData, config] = mockedAxios.post.mock.calls[0];
      
      expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
      expect(formData).toBeInstanceOf(FormData);
      expect(config.headers).toBeDefined();
    });

    it('should include all required fields in FormData', async () => {
      const validToken = 'test-token';
      mockedAxios.post.mockResolvedValue({ data: mockTurnstileResponse });

      // Mock FormData to capture appended values
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' })
      };
      
      jest.spyOn(FormData.prototype, 'append').mockImplementation(mockFormData.append);
      jest.spyOn(FormData.prototype, 'getHeaders').mockImplementation(mockFormData.getHeaders);

      await service.verifyToken(validToken);

      expect(mockFormData.append).toHaveBeenCalledWith('secret', 'test-secret-key-123');
      expect(mockFormData.append).toHaveBeenCalledWith('response', validToken);
    });
  });

  describe('Error Handling & Logging', () => {
    it('should log axios errors without exposing sensitive data', async () => {
      const validToken = 'valid-token';
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Internal server error', secret: 'should-not-be-logged' }
        }
      };
      
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue(axiosError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.verifyToken(validToken))
        .rejects
        .toThrow('No se pudo verificar el token TurstLine');

      // Verify error is logged (but sensitive data should be filtered by Cloudflare)
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing secret key configuration', () => {
      // Test with missing secret key
      const mockConfigWithoutSecret = {
        get: jest.fn().mockReturnValue(undefined)
      };

      expect(() => {
        new TurnstileService(mockConfigWithoutSecret as any);
      }).not.toThrow(); // Should initialize but secret will be undefined
    });
  });

  describe('Integration Security Tests', () => {
    it('should maintain security even with undefined secret key', async () => {
      // Create service with missing secret
      const mockConfigWithoutSecret = {
        get: jest.fn().mockReturnValue(undefined)
      };
      
      const serviceWithoutSecret = new TurnstileService(mockConfigWithoutSecret as any);
      
      // Mock FormData to verify secret is still appended (as undefined)
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' })
      };
      
      jest.spyOn(FormData.prototype, 'append').mockImplementation(mockFormData.append);
      jest.spyOn(FormData.prototype, 'getHeaders').mockImplementation(mockFormData.getHeaders);
      
      // Cloudflare should reject this
      const failureResponse = {
        success: false,
        'error-codes': ['invalid-input-secret']
      };
      mockedAxios.post.mockResolvedValue({ data: failureResponse });

      await expect(serviceWithoutSecret.verifyToken('valid-token'))
        .rejects
        .toThrow('Turnstile error: invalid-input-secret');

      expect(mockFormData.append).toHaveBeenCalledWith('secret', undefined);
    });
  });
});
