import { Test, TestingModule } from '@nestjs/testing';
import { GlobaldataService } from './globaldata.service';

describe('GlobaldataService', () => {
  let service: GlobaldataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobaldataService],
    }).compile();

    service = module.get<GlobaldataService>(GlobaldataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
