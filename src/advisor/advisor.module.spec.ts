
import { Test, TestingModule } from '@nestjs/testing';
import { AdvisorModule } from './advisor.module';

describe('AdvisorModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AdvisorModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
