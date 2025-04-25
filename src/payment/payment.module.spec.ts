
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentModule } from './payment.module';

describe('PaymentModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PaymentModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
