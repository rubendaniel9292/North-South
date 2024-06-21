import { Test, TestingModule } from '@nestjs/testing';
import { ControllesController } from './controlles.controller';

describe('ControllesController', () => {
  let controller: ControllesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ControllesController],
    }).compile();

    controller = module.get<ControllesController>(ControllesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
