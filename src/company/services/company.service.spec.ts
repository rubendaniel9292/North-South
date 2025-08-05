import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyService } from './company.service';
import { CompanyEntity } from '../entities/company.entity';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CompanyDTO } from '../dto/company.dto';
import { ErrorManager } from '@/helpers/error.manager';

describe('CompanyService', () => {
  let service: CompanyService;
  let companyRepository: Repository<CompanyEntity>;
  let redisService: RedisModuleService;

  const mockCompanyEntity = {
    id: 1,
    companyName: 'Test Company',
    ci_ruc: '1234567890',
    policies: [],
  };

  const mockCompanyRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(CompanyEntity),
          useValue: mockCompanyRepository,
        },
        {
          provide: RedisModuleService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    companyRepository = module.get<Repository<CompanyEntity>>(getRepositoryToken(CompanyEntity));
    redisService = module.get<RedisModuleService>(RedisModuleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCompany', () => {
    const companyDto: CompanyDTO = {
      companyName: 'Test Company',
      ci_ruc: '1234567890',
    };

    it('should create a company successfully', async () => {
      mockCompanyRepository.save.mockResolvedValue(mockCompanyEntity);
      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.del.mockResolvedValue(undefined);

      const result = await service.createCompany(companyDto);

      expect(mockCompanyRepository.save).toHaveBeenCalledWith(companyDto);
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(result).toEqual(mockCompanyEntity);
    });
  });

  describe('getAllCompanies', () => {
    it('should return companies from cache if available', async () => {
      const cachedCompanies = [mockCompanyEntity];
      mockRedisService.get.mockResolvedValue(cachedCompanies);

      const result = await service.getAllCompanies();

      expect(mockRedisService.get).toHaveBeenCalled();
      expect(mockCompanyRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(cachedCompanies);
    });

    it('should return companies from database and cache them', async () => {
      const companies = [mockCompanyEntity];
      mockRedisService.get.mockResolvedValue(null);
      mockCompanyRepository.find.mockResolvedValue(companies);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.getAllCompanies();

      expect(mockRedisService.get).toHaveBeenCalled();
      expect(mockCompanyRepository.find).toHaveBeenCalledWith({
        order: { id: 'DESC' },
      });
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(result).toEqual(companies);
    });

    it('should throw error when no companies found', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockCompanyRepository.find.mockResolvedValue([]);

      await expect(service.getAllCompanies()).rejects.toThrow();
    });
  });
});
