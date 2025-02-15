import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsPaymentsController } from './commissions-payments.controller';

describe('CommissionsPaymentsController', () => {
  let controller: CommissionsPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommissionsPaymentsController],
    }).compile();

    controller = module.get<CommissionsPaymentsController>(CommissionsPaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
