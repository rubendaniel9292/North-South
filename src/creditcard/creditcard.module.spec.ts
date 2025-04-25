
import { Test, TestingModule } from '@nestjs/testing';
import { CreditcardModule } from './creditcard.module';

describe('CreditcardModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CreditcardModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
