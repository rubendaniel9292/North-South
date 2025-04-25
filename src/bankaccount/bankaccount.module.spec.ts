
import { Test, TestingModule } from '@nestjs/testing';
import { BankAccountModule } from './bankaccount.module';

describe('BankAccountModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [BankAccountModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
