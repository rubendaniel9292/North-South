import { Test, TestingModule } from '@nestjs/testing';
import { GlobaldataController } from './globaldata.controller';

describe('GlobaldataController', () => {
  let controller: GlobaldataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlobaldataController],
    }).compile();

    controller = module.get<GlobaldataController>(GlobaldataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
