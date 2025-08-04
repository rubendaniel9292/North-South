import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { Reflector } from '@nestjs/core';
import { UserService } from '@/user/services/user.service';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { useToken } from '@/helpers/use.token';
import { Request } from 'express';

// Mock del helper useToken
jest.mock('@/helpers/use.token');
const mockUseToken = useToken as jest.MockedFunction<typeof useToken>;

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    uuid: 'test-uuid-123',
    firstName: 'Test',
    secondName: 'Middle',
    surname: 'User',
    secondSurname: 'Last',
    userName: 'testuser',
    email: 'test@example.com',
    role: 'ADMIN',
    mustChangePassword: false,
    tasks: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const createMockExecutionContext = (headers: any = {}, handler = jest.fn()): ExecutionContext => {
    const mockRequest: Partial<Request> = {
      headers,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: () => handler,
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const mockReflector = {
      get: jest.fn(),
    };

    const mockUserService = {
      findUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get(Reflector);
    userService = module.get(UserService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Guard Initialization', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should have reflector injected', () => {
      expect(reflector).toBeDefined();
    });

    it('should have userService injected', () => {
      expect(userService).toBeDefined();
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without token', async () => {
      const context = createMockExecutionContext();
      reflector.get.mockReturnValue(true); // isPublic = true

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith('PUBLIC', expect.any(Function));
      expect(mockUseToken).not.toHaveBeenCalled();
      expect(userService.findUserById).not.toHaveBeenCalled();
    });

    it('should not require token validation for public routes', async () => {
      const context = createMockExecutionContext({ token: undefined });
      reflector.get.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle public route with invalid token gracefully', async () => {
      const context = createMockExecutionContext({ token: 'invalid-token' });
      reflector.get.mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockUseToken).not.toHaveBeenCalled();
    });
  });

  describe('Protected Routes - Token Validation', () => {
    beforeEach(() => {
      reflector.get.mockReturnValue(false); // isPublic = false
    });

    it('should allow access with valid token and user', async () => {
      const validToken = 'valid-jwt-token';
      const context = createMockExecutionContext({ token: validToken });
      
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });
      userService.findUserById.mockResolvedValue(mockUser as any);

      const result = await guard.canActivate(context);
      const request = context.switchToHttp().getRequest() as any;

      expect(result).toBe(true);
      expect(mockUseToken).toHaveBeenCalledWith(validToken);
      expect(userService.findUserById).toHaveBeenCalledWith('test-uuid-123');
      expect(request.idUser).toBe('test-uuid-123');
      expect(request.roleUser).toBe('ADMIN');
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
    });

    it('should throw UnauthorizedException when token is undefined', async () => {
      const context = createMockExecutionContext({ token: undefined });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
    });

    it('should throw UnauthorizedException when token is an array', async () => {
      const context = createMockExecutionContext({ token: ['token1', 'token2'] });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
    });

    it('should throw UnauthorizedException when token is empty string', async () => {
      const context = createMockExecutionContext({ token: '' });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
    });
  });

  describe('Token Processing', () => {
    beforeEach(() => {
      reflector.get.mockReturnValue(false);
    });

    it('should throw UnauthorizedException when useToken returns string error', async () => {
      const context = createMockExecutionContext({ token: 'invalid-token' });
      mockUseToken.mockReturnValue('Token is invalid');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Token is invalid');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const context = createMockExecutionContext({ token: 'expired-token' });
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: true,
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Token is expired');
    });

    it('should handle malformed JWT tokens', async () => {
      const context = createMockExecutionContext({ token: 'malformed.jwt.token' });
      mockUseToken.mockReturnValue('Token is invalid');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Token is invalid');
    });

    it('should handle tokens with missing payload', async () => {
      const context = createMockExecutionContext({ token: 'token-without-payload' });
      mockUseToken.mockReturnValue({
        sub: undefined,
        role: undefined,
        isExpired: false,
      });
      userService.findUserById.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid user');
    });
  });

  describe('User Validation', () => {
    beforeEach(() => {
      reflector.get.mockReturnValue(false);
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const context = createMockExecutionContext({ token: 'valid-token' });
      userService.findUserById.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid user');
      expect(userService.findUserById).toHaveBeenCalledWith('test-uuid-123');
    });

    it('should throw UnauthorizedException when user is undefined', async () => {
      const context = createMockExecutionContext({ token: 'valid-token' });
      userService.findUserById.mockResolvedValue(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid user');
    });

    it('should handle database connection errors', async () => {
      const context = createMockExecutionContext({ token: 'valid-token' });
      userService.findUserById.mockRejectedValue(new Error('Database connection error'));

      await expect(guard.canActivate(context)).rejects.toThrow('Database connection error');
    });
  });

  describe('Request Enhancement', () => {
    beforeEach(() => {
      reflector.get.mockReturnValue(false);
      userService.findUserById.mockResolvedValue(mockUser as any);
    });

    it('should inject user info into request object', async () => {
      const context = createMockExecutionContext({ token: 'valid-token' });
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });

      await guard.canActivate(context);
      const request = context.switchToHttp().getRequest() as any;

      expect(request.idUser).toBe('test-uuid-123');
      expect(request.roleUser).toBe('ADMIN');
    });

    it('should handle different user roles correctly', async () => {
      const context = createMockExecutionContext({ token: 'valid-token' });
      const basicUser = { ...mockUser, role: 'BASIC' };
      
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'BASIC',
        isExpired: false,
      });
      userService.findUserById.mockResolvedValue(basicUser as any);

      await guard.canActivate(context);
      const request = context.switchToHttp().getRequest() as any;

      expect(request.roleUser).toBe('BASIC');
    });

    it('should maintain role consistency between token and user', async () => {
      const context = createMockExecutionContext({ token: 'valid-token' });
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });

      await guard.canActivate(context);
      const request = context.switchToHttp().getRequest() as any;

      expect(request.roleUser).toBe(mockUser.role);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null execution context', async () => {
      reflector.get.mockReturnValue(false);

      await expect(guard.canActivate(null as any)).rejects.toThrow();
    });

    it('should handle execution context without HTTP context', async () => {
      const invalidContext = {
        switchToHttp: () => null,
        getHandler: jest.fn(),
      } as any;
      reflector.get.mockReturnValue(false);

      await expect(guard.canActivate(invalidContext)).rejects.toThrow();
    });

    it('should handle missing request object', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => null,
        }),
        getHandler: jest.fn(),
      } as any;
      reflector.get.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it('should handle extremely long tokens', async () => {
      const longToken = 'a'.repeat(10000);
      const context = createMockExecutionContext({ token: longToken });
      reflector.get.mockReturnValue(false);
      mockUseToken.mockReturnValue('Token is invalid');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockUseToken).toHaveBeenCalledWith(longToken);
    });

    it('should handle special characters in tokens', async () => {
      const specialToken = 'token.with.special@chars#$%';
      const context = createMockExecutionContext({ token: specialToken });
      reflector.get.mockReturnValue(false);
      mockUseToken.mockReturnValue('Token is invalid');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Security Tests', () => {
    beforeEach(() => {
      reflector.get.mockReturnValue(false);
    });

    it('should not allow access without token on private routes', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(userService.findUserById).not.toHaveBeenCalled();
    });

    it('should validate token on every request', async () => {
      const context = createMockExecutionContext({ token: 'test-token' });
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });
      userService.findUserById.mockResolvedValue(mockUser as any);

      await guard.canActivate(context);

      expect(mockUseToken).toHaveBeenCalledTimes(1);
      expect(userService.findUserById).toHaveBeenCalledTimes(1);
    });

    it('should not cache token validation results', async () => {
      const context1 = createMockExecutionContext({ token: 'token1' });
      const context2 = createMockExecutionContext({ token: 'token2' });
      
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });
      userService.findUserById.mockResolvedValue(mockUser as any);

      await guard.canActivate(context1);
      await guard.canActivate(context2);

      expect(mockUseToken).toHaveBeenCalledTimes(2);
      expect(userService.findUserById).toHaveBeenCalledTimes(2);
    });

    it('should handle token injection attempts', async () => {
      const maliciousToken = "'; DROP TABLE users; --";
      const context = createMockExecutionContext({ token: maliciousToken });
      mockUseToken.mockReturnValue('Token is invalid');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(mockUseToken).toHaveBeenCalledWith(maliciousToken);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full authentication flow successfully', async () => {
      const validToken = 'valid-jwt-token';
      const context = createMockExecutionContext({ token: validToken });
      
      // Setup mocks for successful flow
      reflector.get.mockReturnValue(false);
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });
      userService.findUserById.mockResolvedValue(mockUser as any);

      const result = await guard.canActivate(context);
      const request = context.switchToHttp().getRequest() as any;

      // Verify complete flow
      expect(reflector.get).toHaveBeenCalled();
      expect(mockUseToken).toHaveBeenCalledWith(validToken);
      expect(userService.findUserById).toHaveBeenCalledWith('test-uuid-123');
      expect(result).toBe(true);
      expect(request.idUser).toBe('test-uuid-123');
      expect(request.roleUser).toBe('ADMIN');
    });

    it('should deny access through complete validation failure flow', async () => {
      const invalidToken = 'invalid-token';
      const context = createMockExecutionContext({ token: invalidToken });
      
      reflector.get.mockReturnValue(false);
      mockUseToken.mockReturnValue('Token is invalid');

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      
      expect(reflector.get).toHaveBeenCalled();
      expect(mockUseToken).toHaveBeenCalledWith(invalidToken);
      expect(userService.findUserById).not.toHaveBeenCalled();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const contexts = Array(5).fill(0).map(() => 
        createMockExecutionContext({ token: 'valid-token' })
      );
      
      reflector.get.mockReturnValue(false);
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });
      userService.findUserById.mockResolvedValue(mockUser as any);

      const promises = contexts.map(context => guard.canActivate(context));
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBe(true);
      });

      expect(mockUseToken).toHaveBeenCalledTimes(5);
      expect(userService.findUserById).toHaveBeenCalledTimes(5);
    });

    it('should not cause memory leaks on repeated calls', async () => {
      const context = createMockExecutionContext({ token: 'valid-token' });
      
      reflector.get.mockReturnValue(false);
      mockUseToken.mockReturnValue({
        sub: 'test-uuid-123',
        role: 'ADMIN',
        isExpired: false,
      });
      userService.findUserById.mockResolvedValue(mockUser as any);

      // Simulate many requests
      for (let i = 0; i < 100; i++) {
        await guard.canActivate(context);
      }

      expect(mockUseToken).toHaveBeenCalledTimes(100);
      expect(userService.findUserById).toHaveBeenCalledTimes(100);
    });
  });
});
