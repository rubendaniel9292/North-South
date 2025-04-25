
import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsPaymentsModule } from './commissions-payments.module';

describe('CommissionsPaymentsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CommissionsPaymentsModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
