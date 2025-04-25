
import { Test, TestingModule } from '@nestjs/testing';
import { GlobaldataModule } from './globaldata.module';

describe('GlobaldataModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [GlobaldataModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
