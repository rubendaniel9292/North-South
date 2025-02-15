import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsPaymentsService } from './commissions-payments.service';

describe('CommissionsPaymentsService', () => {
  let service: CommissionsPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommissionsPaymentsService],
    }).compile();

    service = module.get<CommissionsPaymentsService>(CommissionsPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
