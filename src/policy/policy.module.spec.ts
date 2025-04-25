
import { Test, TestingModule } from '@nestjs/testing';
import { PolicyModule } from './policy.module';

describe('PolicyModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PolicyModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
