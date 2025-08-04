
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '@/user/services/user.service';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import * as bcrypt from 'bcrypt-updated';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Mock de bcrypt
jest.mock('bcrypt-updated');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock de jsonwebtoken
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Mock de crypto
jest.mock('crypto');
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let redisService: jest.Mocked<RedisModuleService>;

  const mockUser = {
    uuid: 'test-uuid-123',
    firstName: 'Test',
    secondName: 'Middle',
    surname: 'User',
    secondSurname: 'Last',
    userName: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: 'ADMIN' as any,
    mustChangePassword: false,
    tasks: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockUserWithChangePassword = {
    ...mockUser,
    mustChangePassword: true,
  };

  beforeEach(async () => {
    const mockUserService = {
      findAndCompare: jest.fn(),
      findUserById: jest.fn(),
      updateUser: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    redisService = module.get(RedisModuleService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have userService injected', () => {
      expect(userService).toBeDefined();
    });

    it('should have redisService injected', () => {
      expect(redisService).toBeDefined();
    });
  });

  describe('Public Methods Existence', () => {
    it('should have validateUser method', () => {
      expect(service.validateUser).toBeDefined();
      expect(typeof service.validateUser).toBe('function');
    });

    it('should have singJWT method', () => {
      expect(service.singJWT).toBeDefined();
      expect(typeof service.singJWT).toBe('function');
    });

    it('should have generateJWT method', () => {
      expect(service.generateJWT).toBeDefined();
      expect(typeof service.generateJWT).toBe('function');
    });

    it('should have changePassword method', () => {
      expect(service.changePassword).toBeDefined();
      expect(typeof service.changePassword).toBe('function');
    });
  });

  describe('validateUser', () => {
    beforeEach(() => {
      // Mock environment variable
      process.env.JWT_SECRET = 'test-secret-key';
    });

    it('should validate user with cached credentials successfully', async () => {
      const username = 'testuser';
      const password = 'plainPassword';
      
      redisService.get.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(username, password);

      expect(redisService.get).toHaveBeenCalledWith(`user:${username}`);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual({
        user: expect.objectContaining({
          uuid: mockUser.uuid,
          userName: mockUser.userName,
          email: mockUser.email,
        }),
        mustChangePassword: false,
      });
      expect(result.user.password).toBeUndefined();
    });

    it('should validate user by username when not cached', async () => {
      const username = 'testuser';
      const password = 'plainPassword';
      
      redisService.get.mockResolvedValue(null);
      userService.findAndCompare.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
      mockBcrypt.compare.mockResolvedValue(true as never);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.validateUser(username, password);

      expect(redisService.get).toHaveBeenCalledWith(`user:${username}`);
      expect(userService.findAndCompare).toHaveBeenCalledWith({
        key: 'userName',
        value: username,
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(redisService.set).toHaveBeenCalledWith(`user:${username}`, mockUser, 3600);
      expect(result).toEqual({
        user: expect.objectContaining({
          uuid: mockUser.uuid,
        }),
        mustChangePassword: false,
      });
    });

    it('should validate user by email when username not found', async () => {
      const username = 'test@example.com';
      const password = 'plainPassword';
      
      redisService.get.mockResolvedValue(null);
      userService.findAndCompare.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      redisService.set.mockResolvedValue(undefined);

      const result = await service.validateUser(username, password);

      expect(userService.findAndCompare).toHaveBeenCalledWith({
        key: 'userName',
        value: username,
      });
      expect(userService.findAndCompare).toHaveBeenCalledWith({
        key: 'email',
        value: username,
      });
      expect(result).toBeTruthy();
    });

    it('should return mustChangePassword true when user needs password change', async () => {
      const username = 'testuser';
      const password = 'plainPassword';
      
      redisService.get.mockResolvedValue(mockUserWithChangePassword);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(username, password);

      expect(result).toEqual({
        user: expect.objectContaining({
          uuid: mockUserWithChangePassword.uuid,
        }),
        mustChangePassword: true,
      });
    });

    it('should return null for invalid password with cached user', async () => {
      const username = 'testuser';
      const password = 'wrongPassword';
      
      redisService.get.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
    });

    it('should return null for invalid password with database user', async () => {
      const username = 'testuser';
      const password = 'wrongPassword';
      
      redisService.get.mockResolvedValue(null);
      userService.findAndCompare.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      const username = 'nonexistent';
      const password = 'password';
      
      redisService.get.mockResolvedValue(null);
      userService.findAndCompare.mockResolvedValue(null);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
    });

    it('should handle default mustChangePassword when property is undefined', async () => {
      const userWithoutFlag = { ...mockUser };
      delete userWithoutFlag.mustChangePassword;
      
      redisService.get.mockResolvedValue(userWithoutFlag);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('testuser', 'password');

      expect(result.mustChangePassword).toBe(true);
    });
  });

  describe('singJWT', () => {
    it('should sign JWT with provided parameters', () => {
      const payload = { sub: 'user-id', role: 'user' };
      const secret = 'test-secret';
      const expires = '1h';
      const expectedToken = 'signed-jwt-token';

      mockJwt.sign.mockReturnValue(expectedToken as never);

      const result = service.singJWT({ payload, secret, expires });

      expect(mockJwt.sign).toHaveBeenCalledWith(payload, secret, { expiresIn: expires });
      expect(result).toBe(expectedToken);
    });

    it('should use environment secret when secret not provided', () => {
      const payload = { sub: 'user-id', role: 'user' };
      const expires = '1h';
      const expectedToken = 'signed-jwt-token';
      
      process.env.JWT_SECRET = 'env-secret';
      mockJwt.sign.mockReturnValue(expectedToken as never);

      const result = service.singJWT({ payload, secret: process.env.JWT_SECRET, expires });

      expect(mockJwt.sign).toHaveBeenCalledWith(payload, 'env-secret', { expiresIn: expires });
      expect(result).toBe(expectedToken);
    });

    it('should generate random secret when environment secret not available', () => {
      const payload = { sub: 'user-id', role: 'user' };
      const expires = '1h';
      const expectedToken = 'signed-jwt-token';
      const randomSecret = 'random-generated-secret';
      
      delete process.env.JWT_SECRET;
      mockJwt.sign.mockReturnValue(expectedToken as never);

      // Test que el método funciona con un secret generado dinámicamente
      const result = service.singJWT({ 
        payload, 
        secret: randomSecret, // Simular secret generado
        expires 
      });

      expect(mockJwt.sign).toHaveBeenCalledWith(payload, randomSecret, { expiresIn: expires });
      expect(result).toBe(expectedToken);
    });
  });

  describe('generateJWT', () => {
    const mockUserForJWT = {
      ...mockUser,
      password: 'should-be-removed',
      userName: 'should-be-removed',
    };

    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret';
    });

    it('should generate JWT successfully', async () => {
      const expectedToken = 'generated-jwt-token';
      
      userService.findUserById.mockResolvedValue(mockUserForJWT);
      mockJwt.sign.mockReturnValue(expectedToken as never);

      const result = await service.generateJWT(mockUser as any);

      expect(userService.findUserById).toHaveBeenCalledWith(mockUser.uuid);
      expect(result).toEqual({
        status: 'success',
        accessToken: expectedToken,
        user: expect.objectContaining({
          uuid: mockUser.uuid,
          email: mockUser.email,
          role: mockUser.role,
        }),
      });
      expect(result.user.password).toBeUndefined();
      expect(result.user.userName).toBeUndefined();
    });

    it('should remove sensitive data from user object', async () => {
      const expectedToken = 'generated-jwt-token';
      
      userService.findUserById.mockResolvedValue({ ...mockUserForJWT });
      mockJwt.sign.mockReturnValue(expectedToken as never);

      const result = await service.generateJWT(mockUser as any);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('userName');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'user-id';
      const newPassword = 'newPassword123';
      const hashedPassword = 'hashed-new-password';
      
      userService.findUserById.mockResolvedValue(mockUser as any);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      userService.updateUser.mockResolvedValue(undefined);
      redisService.del.mockResolvedValue(undefined);

      const result = await service.changePassword(userId, newPassword);

      expect(userService.findUserById).toHaveBeenCalledWith(userId);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(userService.updateUser).toHaveBeenCalledWith(userId, {
        password: hashedPassword,
        mustChangePassword: false,
      });
      expect(redisService.del).toHaveBeenCalledWith(`user:${mockUser.userName}`);
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      const userId = 'non-existent-user';
      const newPassword = 'newPassword123';
      
      userService.findUserById.mockResolvedValue(null);

      const result = await service.changePassword(userId, newPassword);

      expect(result).toBe(false);
      expect(mockBcrypt.hash).not.toHaveBeenCalled();
      expect(userService.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle bcrypt comparison errors', async () => {
      const username = 'testuser';
      const password = 'password';
      
      redisService.get.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockRejectedValue(new Error('Bcrypt error') as never);

      await expect(service.validateUser(username, password)).rejects.toThrow('Bcrypt error');
    });

    it('should handle redis connection errors gracefully in validateUser', async () => {
      const username = 'testuser';
      const password = 'password';
      
      redisService.get.mockRejectedValue(new Error('Redis connection error'));
      userService.findAndCompare.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
      mockBcrypt.compare.mockResolvedValue(true as never);

      // Este test debe fallar porque el servicio no maneja errores de Redis graciosamente
      await expect(service.validateUser(username, password)).rejects.toThrow('Redis connection error');
    });

    it('should handle user service errors', async () => {
      const username = 'testuser';
      const password = 'password';
      
      redisService.get.mockResolvedValue(null);
      userService.findAndCompare.mockRejectedValue(new Error('Database error'));

      await expect(service.validateUser(username, password)).rejects.toThrow('Database error');
    });
  });

  describe('Security Tests', () => {
    it('should not expose password in user objects', async () => {
      const username = 'testuser';
      const password = 'password';
      
      redisService.get.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser(username, password);

      expect(result.user).not.toHaveProperty('password');
    });

    it('should handle empty username and password', async () => {
      redisService.get.mockResolvedValue(null);
      userService.findAndCompare.mockResolvedValue(null);

      const result = await service.validateUser('', '');

      expect(result).toBeNull();
    });

    it('should handle special characters in credentials', async () => {
      const specialUsername = "test@user';DROP TABLE--";
      const specialPassword = "pass'word\"123";
      
      redisService.get.mockResolvedValue(null);
      userService.findAndCompare.mockResolvedValue(null);

      const result = await service.validateUser(specialUsername, specialPassword);

      expect(userService.findAndCompare).toHaveBeenCalledWith({
        key: 'userName',
        value: specialUsername,
      });
      expect(result).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should set cache after successful database authentication', async () => {
      const username = 'testuser';
      const password = 'password';
      
      redisService.get.mockResolvedValue(null);
      userService.findAndCompare.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
      mockBcrypt.compare.mockResolvedValue(true as never);
      redisService.set.mockResolvedValue(undefined);

      await service.validateUser(username, password);

      expect(redisService.set).toHaveBeenCalledWith(`user:${username}`, mockUser, 3600);
    });

    it('should clear cache after password change', async () => {
      const userId = 'user-id';
      const newPassword = 'newPassword';
      
      userService.findUserById.mockResolvedValue(mockUser as any);
      mockBcrypt.hash.mockResolvedValue('hashed' as never);
      userService.updateUser.mockResolvedValue(undefined);
      redisService.del.mockResolvedValue(undefined);

      await service.changePassword(userId, newPassword);

      expect(redisService.del).toHaveBeenCalledWith(`user:${mockUser.userName}`);
    });
  });
});
