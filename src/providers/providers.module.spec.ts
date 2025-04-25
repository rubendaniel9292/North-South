
import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersModule } from './providers.module';

describe('ProvidersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ProvidersModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
