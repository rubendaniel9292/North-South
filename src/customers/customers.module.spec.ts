
import { Test, TestingModule } from '@nestjs/testing';
import { CustomersModule } from './customers.module';

describe('CustomersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CustomersModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
