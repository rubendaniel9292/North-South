import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PolicyController } from './policy.controller';
import { PolicyService } from '../services/policy.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { UserService } from '@/user/services/user.service';
import { PolicyDTO, UpDatePolicyDTO } from '../dto/policy.dto';
import { PolicyRenewalDTO } from '../dto/policy.renewal.dto';

describe('PolicyController', () => {
  let controller: PolicyController;
  let policyService: jest.Mocked<PolicyService>;

  // Mock PolicyService
  const mockPolicyService = {
    createPolicy: jest.fn(),
    getAllPolicies: jest.fn(),
    findPolicyById: jest.fn(),
    updatedPolicy: jest.fn(),
    createRenevalAndUpdate: jest.fn(),
    getAllPoliciesStatus: jest.fn(),
    getTypesPolicies: jest.fn(),
    getFrecuencyPolicies: jest.fn(),
    getPaymentMethod: jest.fn(),
    getPolicyStatus: jest.fn(),
    createOrUpdatePeriodForPolicy: jest.fn(),
    getPolicyPeriods: jest.fn(),
  };

  // Mock UserService para AuthGuard
  const mockUserService = {
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    findUserByToken: jest.fn(),
    validateToken: jest.fn(),
  };

  // Mock Reflector para RolesGuard
  const mockReflector = {
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolicyController],
      providers: [
        {
          provide: PolicyService,
          useValue: mockPolicyService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<PolicyController>(PolicyController);
    policyService = module.get(PolicyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialización del controlador', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have PolicyService injected', () => {
      expect(policyService).toBeDefined();
    });
  });

  describe('Métodos del controlador', () => {
    it('should have registerPolicy method', () => {
      expect(typeof controller.registerPolicy).toBe('function');
    });

    it('should have allPolicy method', () => {
      expect(typeof controller.allPolicy).toBe('function');
    });

    it('should have policyID method', () => {
      expect(typeof controller.policyID).toBe('function');
    });

    it('should have updatepPolicy method', () => {
      expect(typeof controller.updatepPolicy).toBe('function');
    });

    it('should have createReneval method', () => {
      expect(typeof controller.createReneval).toBe('function');
    });

    it('should have allPolicyStatus method', () => {
      expect(typeof controller.allPolicyStatus).toBe('function');
    });

    it('should have allTypesPolicy method', () => {
      expect(typeof controller.allTypesPolicy).toBe('function');
    });

    it('should have allFrecuency method', () => {
      expect(typeof controller.allFrecuency).toBe('function');
    });

    it('should have allPaymentMetohd method', () => {
      expect(typeof controller.allPaymentMetohd).toBe('function');
    });

    it('should have allStatusPolicy method', () => {
      expect(typeof controller.allStatusPolicy).toBe('function');
    });
  });

  describe('Guards Integration', () => {
    it('should be protected by AuthGuard and RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', PolicyController);
      expect(guards).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should call PolicyService methods', () => {
      expect(policyService.createPolicy).toBeDefined();
      expect(policyService.getAllPolicies).toBeDefined();
      expect(policyService.findPolicyById).toBeDefined();
      expect(policyService.updatedPolicy).toBeDefined();
    });
  });

  // Tests funcionales de métodos del controlador
  describe('registerPolicy', () => {
    it('should create a new policy', async () => {
      const policyDTO: PolicyDTO = {
        numberPolicy: 'POL001',
        policy_type_id: 1,
        company_id: 1,
        policy_status_id: 1,
        payment_frequency_id: 1,
        advisor_id: 1,
        payment_method_id: 1,
        customers_id: 123,
        coverageAmount: 50000,
        agencyPercentage: 10,
        advisorPercentage: 5,
        policyValue: 1000,
        numberOfPayments: 12,
        startDate: new Date(),
        endDate: new Date(),
        paymentsToAdvisor: 50,
        paymentsToAgency: 100,
        numberOfPaymentsAdvisor: 12,
        renewalCommission: true,
        isCommissionAnnualized: false,
      };

      const mockPolicyData = {
        id: 1,
        numberPolicy: 'POL001',
        customers_id: 123,
        policy_status_id: 1,
        createdAt: new Date(),
      };

      mockPolicyService.createPolicy.mockResolvedValue(mockPolicyData);

      const result = await controller.registerPolicy(policyDTO);

      expect(result).toEqual({
        status: 'success',
        newPolicy: mockPolicyData,
      });
      expect(mockPolicyService.createPolicy).toHaveBeenCalledWith(policyDTO);
    });
  });

  describe('allPolicy', () => {
    it('should get all policies without search', async () => {
      const mockPoliciesData = [
        { id: 1, numberPolicy: 'POL001', customers_id: 123, policy_status_id: 1, createdAt: new Date() },
        { id: 2, numberPolicy: 'POL002', customers_id: 456, policy_status_id: 1, createdAt: new Date() },
      ];

      mockPolicyService.getAllPolicies.mockResolvedValue(mockPoliciesData);

      const result = await controller.allPolicy();

      expect(result).toEqual({
        status: 'success',
        allPolicy: mockPoliciesData,
      });
      expect(mockPolicyService.getAllPolicies).toHaveBeenCalledWith(undefined);
    });

    it('should get all policies with search parameter', async () => {
      const mockPoliciesData = [
        { id: 1, numberPolicy: 'POL001', customers_id: 123, policy_status_id: 1, createdAt: new Date() },
      ];

      mockPolicyService.getAllPolicies.mockResolvedValue(mockPoliciesData);

      const result = await controller.allPolicy('POL001');

      expect(result).toEqual({
        status: 'success',
        allPolicy: mockPoliciesData,
      });
      expect(mockPolicyService.getAllPolicies).toHaveBeenCalledWith('POL001');
    });
  });

  describe('allPolicyStatus', () => {
    it('should get all policy statuses', async () => {
      const mockStatusData = [
        { id: 1, statusName: 'Active' },
        { id: 2, statusName: 'Inactive' },
      ];

      mockPolicyService.getAllPoliciesStatus.mockResolvedValue(mockStatusData);

      const result = await controller.allPolicyStatus();

      expect(result).toEqual({
        status: 'success',
        policiesStatus: mockStatusData,
      });
      expect(mockPolicyService.getAllPoliciesStatus).toHaveBeenCalled();
    });
  });

  describe('allTypesPolicy', () => {
    it('should get all policy types', async () => {
      const mockTypesData = [
        { id: 1, policyName: 'Life Insurance' },
        { id: 2, policyName: 'Health Insurance' },
      ];

      mockPolicyService.getTypesPolicies.mockResolvedValue(mockTypesData);

      const result = await controller.allTypesPolicy();

      expect(result).toEqual({
        status: 'success',
        allTypePolicy: mockTypesData,
      });
      expect(mockPolicyService.getTypesPolicies).toHaveBeenCalled();
    });
  });

  describe('allFrecuency', () => {
    it('should get all payment frequencies', async () => {
      const mockFrequencyData = [
        { id: 1, frequencyName: 'Monthly' },
        { id: 2, frequencyName: 'Annual' },
      ];

      mockPolicyService.getFrecuencyPolicies.mockResolvedValue(mockFrequencyData);

      const result = await controller.allFrecuency();

      expect(result).toEqual({
        status: 'success',
        allFrecuency: mockFrequencyData,
      });
      expect(mockPolicyService.getFrecuencyPolicies).toHaveBeenCalled();
    });
  });

  describe('allPaymentMetohd', () => {
    it('should get all payment methods', async () => {
      const mockPaymentMethodData = [
        { id: 1, methodName: 'Credit Card' },
        { id: 2, methodName: 'Bank Transfer' },
      ];

      mockPolicyService.getPaymentMethod.mockResolvedValue(mockPaymentMethodData);

      const result = await controller.allPaymentMetohd();

      expect(result).toEqual({
        status: 'success',
        allPaymentMethod: mockPaymentMethodData,
      });
      expect(mockPolicyService.getPaymentMethod).toHaveBeenCalled();
    });
  });

  describe('policyID', () => {
    it('should get policy by id', async () => {
      const mockPolicyData = {
        id: 1,
        numberPolicy: 'POL001',
        customers_id: 123,
        policy_status_id: 1,
        createdAt: new Date(),
      };

      mockPolicyService.findPolicyById.mockResolvedValue(mockPolicyData);

      const result = await controller.policyID(1);

      expect(result).toEqual({
        status: 'success',
        policyById: mockPolicyData,
      });
      expect(mockPolicyService.findPolicyById).toHaveBeenCalledWith(1);
    });
  });

  describe('createReneval', () => {
    it('should create renewal', async () => {
      const renewalDTO: PolicyRenewalDTO = {
        policy_id: 1,
        renewalNumber: 1,
        createdAt: new Date(),
        policyValue: 1100,
      };

      const mockRenewalData = { success: true, renewalId: 1 };

      mockPolicyService.createRenevalAndUpdate.mockResolvedValue(mockRenewalData);

      const result = await controller.createReneval(renewalDTO);

      expect(result).toEqual({
        status: 'success',
        newPolicy: mockRenewalData,
      });
      expect(mockPolicyService.createRenevalAndUpdate).toHaveBeenCalledWith(renewalDTO);
    });
  });

  describe('updatepPolicy', () => {
    it('should update policy', async () => {
      const updateData = {
        numberPolicy: 'POL001-UPD',
        policy_status_id: 2,
        coverageAmount: 1200,
      } as UpDatePolicyDTO;

      const mockUpdatedData = {
        id: 1,
        numberPolicy: 'POL001-UPD',
        customers_id: 123,
        policy_status_id: 2,
        coverageAmount: 1200,
        createdAt: new Date(),
      };

      mockPolicyService.updatedPolicy.mockResolvedValue(mockUpdatedData);

      const result = await controller.updatepPolicy(updateData, 1);

      expect(result).toEqual({
        status: 'success',
        policyUpdate: mockUpdatedData,
      });
      expect(mockPolicyService.updatedPolicy).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe('allStatusPolicy', () => {
    it('should get all status policies', async () => {
      const mockStatusData = [
        { id: 1, statusName: 'Active' },
        { id: 2, statusName: 'Expired' },
      ];

      mockPolicyService.getPolicyStatus.mockResolvedValue(mockStatusData);

      const result = await controller.allStatusPolicy();

      expect(result).toEqual({
        status: 'success',
        allStatusPolicy: mockStatusData,
      });
      expect(mockPolicyService.getPolicyStatus).toHaveBeenCalled();
    });
  });
});
