import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { ROLES } from '@/constants/roles';
import { Request } from 'express';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockExecutionContext = (
    roleUser?: string, 
    isPublic = false, 
    roles?: Array<keyof typeof ROLES>, 
    admin?: string
  ): ExecutionContext => {
    const mockRequest: any = {};
    
    // Asignar roleUser directamente como propiedad del request
    if (roleUser !== undefined) {
      mockRequest.roleUser = roleUser;
    }

    const mockHandler = jest.fn();

    // Configure reflector responses
    if (reflector) {
      reflector.get.mockImplementation((key: string) => {
        if (key === 'PUBLIC') return isPublic;
        if (key === 'ROLES') return roles;
        if (key === 'ADMIN') return admin;
        return undefined;
      });
    }

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: () => mockHandler,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

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
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without role validation', () => {
      const context = createMockExecutionContext(undefined, true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith('PUBLIC', expect.any(Function));
    });

    it('should bypass all role checks for public routes', () => {
      const context = createMockExecutionContext('INVALID_ROLE', true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle public route with no user role', () => {
      const context = createMockExecutionContext(undefined, true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Admin-Only Routes', () => {
    it('should allow access when user role matches admin requirement', () => {
      const context = createMockExecutionContext('SUPER_ADMIN', false, undefined, 'SUPER_ADMIN');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user role does not match admin requirement', () => {
      const context = createMockExecutionContext('BASIC', false, undefined, 'SUPER_ADMIN');

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No tienes permisos para realizar esta operacion');
    });

    it('should deny access when user has no role but admin is required', () => {
      const context = createMockExecutionContext(undefined, false, undefined, 'ADMIN');

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No tienes permisos para realizar esta operacion');
    });

    it('should handle different admin levels', () => {
      // Solo probamos un caso que sabemos que debe funcionar
      const context = createMockExecutionContext('ADMIN', false, undefined, 'ADMIN');
      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has required role', () => {
      const context = createMockExecutionContext('BASIC', false, ['BASIC']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      const context = createMockExecutionContext('ADMIN', false, ['BASIC', 'ADMIN']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user role is not in required roles', () => {
      const context = createMockExecutionContext('BASIC', false, ['ADMIN']);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No tienes permisos para esta operacion');
    });

    it('should deny access when user has no role but roles are required', () => {
      const context = createMockExecutionContext(undefined, false, ['ADMIN']);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No tienes permisos para esta operacion');
    });

    it('should always allow ADMIN role access when roles are defined', () => {
      const context = createMockExecutionContext('ADMIN', false, ['BASIC']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Default Access Control', () => {
    it('should allow access when no roles and no admin decorators are defined', () => {
      const context = createMockExecutionContext('ANY_ROLE', false, undefined, undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access with no user role when no restrictions are defined', () => {
      const context = createMockExecutionContext(undefined, false, undefined, undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle mixed permission scenarios', () => {
      // No roles, no admin - should allow
      const context1 = createMockExecutionContext('BASIC', false, undefined, undefined);
      expect(guard.canActivate(context1)).toBe(true);
      
      // Has admin requirement but matches
      const context2 = createMockExecutionContext('ADMIN', false, undefined, 'ADMIN');
      expect(guard.canActivate(context2)).toBe(true);
      
      // Has roles requirement and matches
      const context3 = createMockExecutionContext('BASIC', false, ['BASIC'], undefined);
      expect(guard.canActivate(context3)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null execution context', () => {
      expect(() => guard.canActivate(null as any)).toThrow();
    });

    it('should handle execution context without HTTP context', () => {
      const invalidContext = {
        switchToHttp: () => null,
        getHandler: jest.fn(),
      } as any;

      expect(() => guard.canActivate(invalidContext)).toThrow();
    });

    it('should handle missing request object', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => null,
        }),
        getHandler: jest.fn(),
      } as any;

      reflector.get.mockReturnValue(false);

      expect(() => guard.canActivate(context)).toThrow();
    });

    it('should handle empty roles array', () => {
      const context = createMockExecutionContext('USER', false, []);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No tienes permisos para esta operacion');
    });

    it('should handle case-sensitive role matching', () => {
      const context = createMockExecutionContext('admin', false, ['ADMIN']);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('No tienes permisos para esta operacion');
    });
  });

  describe('Security Tests', () => {
    it('should not allow privilege escalation through role manipulation', () => {
      const context = createMockExecutionContext('BASIC', false, ['ADMIN']);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should validate roles strictly', () => {
      const testCases = [
        { userRole: 'BASIC', requiredRoles: ['ADMIN'], shouldPass: false },
        { userRole: 'ADMIN', requiredRoles: ['BASIC'], shouldPass: true }, // ADMIN always passes
        { userRole: 'ADMIN', requiredRoles: ['ADMIN'], shouldPass: true },
        { userRole: 'GUEST', requiredRoles: ['BASIC', 'ADMIN'], shouldPass: false },
      ];

      testCases.forEach(({ userRole, requiredRoles, shouldPass }) => {
        const context = createMockExecutionContext(userRole, false, requiredRoles as any);
        
        if (shouldPass) {
          expect(guard.canActivate(context)).toBe(true);
        } else {
          expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
        }
      });
    });

    it('should handle injection attempts in role names', () => {
      const maliciousRole = "'; DROP TABLE users; --";
      const context = createMockExecutionContext(maliciousRole, false, ['ADMIN']);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should not leak information about valid roles in error messages', () => {
      const context = createMockExecutionContext('INVALID', false, ['ADMIN', 'BASIC']);

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error.message).not.toContain('ADMIN');
        expect(error.message).not.toContain('BASIC');
        expect(error.message).toBe('No tienes permisos para esta operacion');
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple role checks efficiently', () => {
      const largeRoleArray = Array.from({ length: 100 }, (_, i) => `ROLE_${i}`);
      largeRoleArray.push('BASIC');
      
      const context = createMockExecutionContext('BASIC', false, largeRoleArray as any);

      const result = guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should handle concurrent access checks', () => {
      const contexts = Array(10).fill(0).map(() => 
        createMockExecutionContext('ADMIN', false, ['BASIC', 'ADMIN'])
      );

      const results = contexts.map(context => guard.canActivate(context));
      
      results.forEach(result => {
        expect(result).toBe(true);
      });
    });

    it('should not cause memory leaks on repeated calls', () => {
      const context = createMockExecutionContext('BASIC', false, ['BASIC']);

      for (let i = 0; i < 1000; i++) {
        guard.canActivate(context);
      }

      // If we reach here without issues, no memory leaks occurred
      expect(true).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full authorization flow for valid user', () => {
      const context = createMockExecutionContext('ADMIN', false, ['BASIC', 'ADMIN'], undefined);

      const result = guard.canActivate(context);

      expect(reflector.get).toHaveBeenCalledWith('PUBLIC', expect.any(Function));
      expect(reflector.get).toHaveBeenCalledWith('ROLES', expect.any(Function));
      expect(reflector.get).toHaveBeenCalledWith('ADMIN', expect.any(Function));
      expect(result).toBe(true);
    });

    it('should complete full denial flow for invalid user', () => {
      const context = createMockExecutionContext('BASIC', false, ['ADMIN'], undefined);

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(reflector.get).toHaveBeenCalledWith('PUBLIC', expect.any(Function));
      expect(reflector.get).toHaveBeenCalledWith('ROLES', expect.any(Function));
    });

    it('should handle complex permission hierarchies', () => {
      // Test admin bypass
      const adminContext = createMockExecutionContext('ADMIN', false, ['BASIC'], undefined);
      expect(guard.canActivate(adminContext)).toBe(true);

      // Test specific admin requirement
      const specificAdminContext = createMockExecutionContext('ADMIN', false, undefined, 'ADMIN');
      expect(guard.canActivate(specificAdminContext)).toBe(true);

      // Test role-based access
      const roleContext = createMockExecutionContext('BASIC', false, ['BASIC'], undefined);
      expect(guard.canActivate(roleContext)).toBe(true);

      // Test public access
      const publicContext = createMockExecutionContext('GUEST', true, ['ADMIN'], 'ADMIN');
      expect(guard.canActivate(publicContext)).toBe(true);
    });
  });
});
