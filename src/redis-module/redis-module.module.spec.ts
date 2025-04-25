
import { Test, TestingModule } from '@nestjs/testing';
import { RedisModuleModule } from './redis-module.module';

describe('RedisModuleModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RedisModuleModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
