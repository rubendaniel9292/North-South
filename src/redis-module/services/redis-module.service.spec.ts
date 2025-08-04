import { Test, TestingModule } from '@nestjs/testing';
import { RedisModuleService } from './redis-module.service';

// Mock del cliente Redis NO usa Redis real
const mockRedisClient = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
  flushAll: jest.fn(),
  disconnect: jest.fn(),
  ping: jest.fn(),
  keys: jest.fn(),
};

describe('RedisModuleService', () => {
  let service: RedisModuleService;

  beforeEach(async () => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisModuleService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisModuleService>(RedisModuleService);
  });

  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('set method', () => {
    it('should set a value without TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      mockRedisClient.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });

    it('should set a value with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 3600;

      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.expire.mockResolvedValue(1);

      await service.set(key, value, ttl);

      expect(mockRedisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(mockRedisClient.expire).toHaveBeenCalledWith(key, ttl);
    });

    it('should handle errors gracefully', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

      // No debería lanzar error
      await expect(service.set(key, value)).resolves.toBeUndefined();
    });
  });

  describe('get method', () => {
    it('should get and parse a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should return null when key does not exist', async () => {
      const key = 'non-existent-key';

      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      const key = 'test-key';

      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get(key);

      expect(result).toBeNull();
    });
  });

  describe('del method', () => {
    it('should delete a key', async () => {
      const key = 'test-key';

      mockRedisClient.del.mockResolvedValue(1);

      await service.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });

    it('should handle errors gracefully', async () => {
      const key = 'test-key';

      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.del(key)).resolves.toBeUndefined();
    });
  });

  describe('flushAll method', () => {
    it('should flush all cache', async () => {
      mockRedisClient.flushAll.mockResolvedValue('OK');

      await service.flushAll();

      expect(mockRedisClient.flushAll).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.flushAll.mockRejectedValue(new Error('Redis error'));

      await expect(service.flushAll()).resolves.toBeUndefined();
    });
  });

  describe('isConnected method', () => {
    it('should return true when Redis is connected', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.isConnected();

      expect(result).toBe(true);
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should return false when Redis is not connected', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await service.isConnected();

      expect(result).toBe(false);
    });
  });

  describe('deletePattern method', () => {
    it('should delete keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:key1', 'test:key2'];

      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(2);

      await service.deletePattern(pattern);

      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
    });

    it('should not delete when no keys match pattern', async () => {
      const pattern = 'nonexistent:*';

      mockRedisClient.keys.mockResolvedValue([]);

      await service.deletePattern(pattern);

      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const pattern = 'test:*';

      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      await expect(service.deletePattern(pattern)).resolves.toBeUndefined();
    });
  });
});
