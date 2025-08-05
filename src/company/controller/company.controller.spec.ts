import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from '../services/company.service';
import { CompanyDTO } from '../dto/company.dto';

describe('CompanyController', () => {
  let controller: CompanyController;
  let companyService: CompanyService;

  const mockCompanyEntity = {
    id: 1,
    companyName: 'Test Company',
    ci_ruc: '1234567890',
    policies: [],
  };

  const mockCompanyService = {
    createCompany: jest.fn(),
    getAllCompanies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard({} as any) // Disable all guards for testing
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CompanyController>(CompanyController);
    companyService = module.get<CompanyService>(CompanyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerCompany', () => {
    const companyDto: CompanyDTO = {
      companyName: 'Test Company',
      ci_ruc: '1234567890',
    };

    it('should register a company successfully', async () => {
      mockCompanyService.createCompany.mockResolvedValue(mockCompanyEntity);

      const result = await controller.registerCompany(companyDto);

      expect(mockCompanyService.createCompany).toHaveBeenCalledWith(companyDto);
      expect(result).toEqual({
        status: 'success',
        message: 'Compañía registrada exitosamente',
        data: {
          id: mockCompanyEntity.id,
          companyName: mockCompanyEntity.companyName,
          ci_ruc: mockCompanyEntity.ci_ruc,
        },
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockCompanyService.createCompany.mockRejectedValue(error);

      await expect(controller.registerCompany(companyDto)).rejects.toThrow(error);
    });
  });

  describe('getCompanies', () => {
    it('should return all companies successfully', async () => {
      const companies = [mockCompanyEntity];
      mockCompanyService.getAllCompanies.mockResolvedValue(companies);

      const result = await controller.getCompanies();

      expect(mockCompanyService.getAllCompanies).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'success',
        message: `Se encontraron ${companies.length} compañías`,
        data: companies,
        count: companies.length,
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockCompanyService.getAllCompanies.mockRejectedValue(error);

      await expect(controller.getCompanies()).rejects.toThrow(error);
    });
  });
});
