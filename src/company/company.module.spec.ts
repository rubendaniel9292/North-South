
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CompanyModule } from './company.module';
import { CompanyEntity } from './entities/company.entity';
import { CompanyService } from './services/company.service';
import { CompanyController } from './controller/company.controller';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

describe('CompanyModule', () => {
  let module: TestingModule;

  const mockRepository = {
    find: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CompanyModule],
    })
      .overrideProvider(getRepositoryToken(CompanyEntity))
      .useValue(mockRepository)
      .overrideProvider(RedisModuleService)
      .useValue(mockRedisService)
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have CompanyService', () => {
    const service = module.get<CompanyService>(CompanyService);
    expect(service).toBeDefined();
  });

  it('should have CompanyController', () => {
    const controller = module.get<CompanyController>(CompanyController);
    expect(controller).toBeDefined();
  });
});
