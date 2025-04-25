
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyModule } from './company.module';

describe('CompanyModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CompanyModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
