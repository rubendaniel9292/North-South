
import { Test, TestingModule } from '@nestjs/testing';
import { TurnstileModule } from './turnstile.module';

describe('TurnstileModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TurnstileModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
