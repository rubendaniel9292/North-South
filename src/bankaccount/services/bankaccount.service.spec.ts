import { Test, TestingModule } from '@nestjs/testing';
import { BankAccountService } from './bankaccount.service';

describe('BankaccountService', () => {
  let service:  BankAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ BankAccountService],
    }).compile();

    service = module.get< BankAccountService>( BankAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
