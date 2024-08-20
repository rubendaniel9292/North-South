import { Test, TestingModule } from '@nestjs/testing';
import { CreditcardService } from './creditcard.service';

describe('CreditcardService', () => {
  let service: CreditcardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreditcardService],
    }).compile();

    service = module.get<CreditcardService>(CreditcardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
