import { Test, TestingModule } from '@nestjs/testing';
import { RedisModuleService } from './redis-module.service';

describe('RedisModuleService', () => {
  let service: RedisModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisModuleService],
    }).compile();

    service = module.get<RedisModuleService>(RedisModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
