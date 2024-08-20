import { Test, TestingModule } from '@nestjs/testing';
import { CreditcardController } from './creditcard.controller';

describe('CreditcardController', () => {
  let controller: CreditcardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditcardController],
    }).compile();

    controller = module.get<CreditcardController>(CreditcardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
