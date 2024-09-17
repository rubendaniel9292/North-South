import { Test, TestingModule } from '@nestjs/testing';
import { BankaccountController } from './bankaccount.controller';

describe('BankaccountController', () => {
  let controller: BankaccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankaccountController],
    }).compile();

    controller = module.get<BankaccountController>(BankaccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
