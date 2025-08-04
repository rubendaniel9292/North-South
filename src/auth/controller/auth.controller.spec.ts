
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { TurnstileService } from '@/turnstile/services/turnstile.service';
import { AuthGuard } from '../guards/auth.guard';
import { Reflector } from '@nestjs/core';
import { UserService } from '@/user/services/user.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from '../dto/auth.dto';
import { ChangePasswordDTO } from '../dto/ChangePasswordDTO';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let turnstileService: jest.Mocked<TurnstileService>;

  const mockUser = {
    uuid: 'test-uuid-123',
    firstName: 'Test',
    secondName: 'Middle',
    surname: 'User',
    secondSurname: 'Last',
    userName: 'testuser',
    email: 'test@example.com',
    role: 'ADMIN' as any,
    mustChangePassword: false,
    tasks: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockUserWithPasswordChange = {
    ...mockUser,
    mustChangePassword: true,
  };

  const mockJWTResponse = {
    status: 'success',
    accessToken: 'jwt-token-123',
    user: mockUser,
  };

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
      generateJWT: jest.fn(),
      changePassword: jest.fn(),
    };

    const mockTurnstileService = {
      verifyToken: jest.fn(),
    };

    const mockUserService = {
      findUserById: jest.fn(),
      findAndCompare: jest.fn(),
    };

    const mockAuthGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: TurnstileService,
          useValue: mockTurnstileService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(() => true), // Mock public access
          },
        },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue(mockAuthGuard)
    .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    turnstileService = module.get(TurnstileService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(authService).toBeDefined();
    });

    it('should have turnstileService injected', () => {
      expect(turnstileService).toBeDefined();
    });
  });

  describe('Public Methods Existence', () => {
    it('should have login method', () => {
      expect(controller.login).toBeDefined();
      expect(typeof controller.login).toBe('function');
    });

    it('should have changePassword method', () => {
      expect(controller.changePassword).toBeDefined();
      expect(typeof controller.changePassword).toBe('function');
    });
  });

  describe('login', () => {
    const validLoginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
      turnstileToken: 'valid-turnstile-token',
    };

    it('should login successfully with valid credentials', async () => {
      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue({
        user: mockUser,
        mustChangePassword: false,
      });
      authService.generateJWT.mockResolvedValue(mockJWTResponse);

      const result = await controller.login(validLoginDto);

      expect(turnstileService.verifyToken).toHaveBeenCalledWith('valid-turnstile-token');
      expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(authService.generateJWT).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockJWTResponse);
    });

    it('should return mustChangePassword response when user needs password change', async () => {
      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue({
        user: mockUserWithPasswordChange,
        mustChangePassword: true,
      });

      const result = await controller.login(validLoginDto);

      expect(turnstileService.verifyToken).toHaveBeenCalledWith('valid-turnstile-token');
      expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(authService.generateJWT).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'must_change_password',
        message: 'Debes cambiar tu contraseña antes de continuar.',
        mustChangePassword: true,
        userId: mockUserWithPasswordChange.uuid,
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(validLoginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(validLoginDto)).rejects.toThrow('Data not valid');

      expect(turnstileService.verifyToken).toHaveBeenCalledWith('valid-turnstile-token');
      expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(authService.generateJWT).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid turnstile token', async () => {
      turnstileService.verifyToken.mockRejectedValue(new Error('Invalid turnstile token'));

      await expect(controller.login(validLoginDto)).rejects.toThrow(BadRequestException);
      await expect(controller.login(validLoginDto)).rejects.toThrow('Fallo en la verificación de turnstileToken');

      expect(turnstileService.verifyToken).toHaveBeenCalledWith('valid-turnstile-token');
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should handle login with email as username', async () => {
      const emailLoginDto: LoginDto = {
        username: 'test@example.com',
        password: 'password123',
        turnstileToken: 'valid-turnstile-token',
      };

      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue({
        user: mockUser,
        mustChangePassword: false,
      });
      authService.generateJWT.mockResolvedValue(mockJWTResponse);

      const result = await controller.login(emailLoginDto);

      expect(authService.validateUser).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result).toEqual(mockJWTResponse);
    });

    it('should handle empty turnstile token', async () => {
      const loginWithoutToken: LoginDto = {
        username: 'testuser',
        password: 'password123',
        turnstileToken: '',
      };

      turnstileService.verifyToken.mockRejectedValue(new Error('Empty token'));

      await expect(controller.login(loginWithoutToken)).rejects.toThrow(BadRequestException);
    });

    it('should handle missing turnstile token', async () => {
      const loginWithoutToken = {
        username: 'testuser',
        password: 'password123',
      } as LoginDto;

      turnstileService.verifyToken.mockRejectedValue(new Error('Missing token'));

      await expect(controller.login(loginWithoutToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    const validChangePasswordDto: ChangePasswordDTO = {
      userId: 'test-uuid-123',
      newPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      authService.changePassword.mockResolvedValue(true);

      const result = await controller.changePassword(validChangePasswordDto);

      expect(authService.changePassword).toHaveBeenCalledWith('test-uuid-123', 'newPassword123');
      expect(result).toEqual({
        status: 'success',
        message: 'Contraseña cambiada correctamente. Ahora puedes iniciar sesión.',
        ok: true,
      });
    });

    it('should throw BadRequestException when password change fails', async () => {
      authService.changePassword.mockResolvedValue(false);

      await expect(controller.changePassword(validChangePasswordDto)).rejects.toThrow(BadRequestException);
      await expect(controller.changePassword(validChangePasswordDto)).rejects.toThrow('No se pudo cambiar la contraseña');

      expect(authService.changePassword).toHaveBeenCalledWith('test-uuid-123', 'newPassword123');
    });

    it('should handle invalid userId', async () => {
      const invalidUserDto: ChangePasswordDTO = {
        userId: 'invalid-uuid',
        newPassword: 'newPassword123',
      };

      authService.changePassword.mockResolvedValue(false);

      await expect(controller.changePassword(invalidUserDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle empty new password', async () => {
      const emptyPasswordDto: ChangePasswordDTO = {
        userId: 'test-uuid-123',
        newPassword: '',
      };

      authService.changePassword.mockResolvedValue(false);

      await expect(controller.changePassword(emptyPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Error Handling', () => {
    const validLoginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
      turnstileToken: 'valid-token',
    };

    it('should handle authService validateUser errors', async () => {
      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockRejectedValue(new Error('Database connection error'));

      await expect(controller.login(validLoginDto)).rejects.toThrow('Database connection error');
    });

    it('should handle authService generateJWT errors', async () => {
      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue({
        user: mockUser,
        mustChangePassword: false,
      });
      authService.generateJWT.mockRejectedValue(new Error('JWT generation error'));

      await expect(controller.login(validLoginDto)).rejects.toThrow('JWT generation error');
    });

    it('should handle turnstile service network errors', async () => {
      turnstileService.verifyToken.mockRejectedValue(new Error('Network timeout'));

      await expect(controller.login(validLoginDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle authService changePassword errors', async () => {
      const validChangePasswordDto: ChangePasswordDTO = {
        userId: 'test-uuid-123',
        newPassword: 'newPassword123',
      };

      authService.changePassword.mockRejectedValue(new Error('Database update error'));

      await expect(controller.changePassword(validChangePasswordDto)).rejects.toThrow('Database update error');
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive data in responses', async () => {
      const validLoginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
        turnstileToken: 'valid-token',
      };

      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue({
        user: mockUser,
        mustChangePassword: false,
      });
      authService.generateJWT.mockResolvedValue(mockJWTResponse);

      const result = await controller.login(validLoginDto);

      // Solo verificar que no se exponga la contraseña
      expect(result.user).not.toHaveProperty('password');
      // mustChangePassword puede estar presente en el user object, es información válida para el frontend
    });

    it('should handle SQL injection attempts in username', async () => {
      const maliciousLoginDto: LoginDto = {
        username: "admin'; DROP TABLE users; --",
        password: 'password123',
        turnstileToken: 'valid-token',
      };

      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(maliciousLoginDto)).rejects.toThrow(UnauthorizedException);

      expect(authService.validateUser).toHaveBeenCalledWith("admin'; DROP TABLE users; --", 'password123');
    });

    it('should handle XSS attempts in credentials', async () => {
      const xssLoginDto: LoginDto = {
        username: '<script>alert("xss")</script>',
        password: '<img src=x onerror=alert(1)>',
        turnstileToken: 'valid-token',
      };

      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(xssLoginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle extremely long credentials', async () => {
      const longString = 'a'.repeat(10000);
      const longCredentialsDto: LoginDto = {
        username: longString,
        password: longString,
        turnstileToken: 'valid-token',
      };

      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(longCredentialsDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full login flow successfully', async () => {
      const validLoginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
        turnstileToken: 'valid-token',
      };

      // Mock successful flow
      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue({
        user: mockUser,
        mustChangePassword: false,
      });
      authService.generateJWT.mockResolvedValue(mockJWTResponse);

      const result = await controller.login(validLoginDto);

      // Verify complete flow
      expect(turnstileService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(authService.generateJWT).toHaveBeenCalledWith(mockUser);
      expect(result).toHaveProperty('status', 'success');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should complete full password change flow successfully', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'oldPassword',
        turnstileToken: 'valid-token',
      };

      const changePasswordDto: ChangePasswordDTO = {
        userId: 'test-uuid-123',
        newPassword: 'newPassword123',
      };

      // First login - needs password change
      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue({
        user: mockUserWithPasswordChange,
        mustChangePassword: true,
      });

      const loginResult = await controller.login(loginDto);

      expect(loginResult.status).toBe('must_change_password');
      expect(loginResult.userId).toBe(mockUserWithPasswordChange.uuid);

      // Then change password
      authService.changePassword.mockResolvedValue(true);

      const changeResult = await controller.changePassword(changePasswordDto);

      expect(changeResult.status).toBe('success');
      expect(changeResult.ok).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined credentials', async () => {
      const nullCredentialsDto = {
        username: null,
        password: undefined,
        turnstileToken: 'valid-token',
      } as any;

      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(nullCredentialsDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle special unicode characters', async () => {
      const unicodeDto: LoginDto = {
        username: '测试用户名',
        password: 'пароль123',
        turnstileToken: 'valid-token',
      };

      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(unicodeDto)).rejects.toThrow(UnauthorizedException);

      expect(authService.validateUser).toHaveBeenCalledWith('测试用户名', 'пароль123');
    });

    it('should handle concurrent login attempts', async () => {
      const validLoginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
        turnstileToken: 'valid-token',
      };

      turnstileService.verifyToken.mockResolvedValue(undefined);
      authService.validateUser.mockResolvedValue({
        user: mockUser,
        mustChangePassword: false,
      });
      authService.generateJWT.mockResolvedValue(mockJWTResponse);

      // Simulate concurrent requests
      const promises = Array(5).fill(0).map(() => controller.login(validLoginDto));
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toEqual(mockJWTResponse);
      });

      expect(authService.validateUser).toHaveBeenCalledTimes(5);
      expect(authService.generateJWT).toHaveBeenCalledTimes(5);
    });
  });
});
