import { Module } from '@nestjs/common';
import { TurnstileService } from './services/turnstile.service';

@Module({
  providers: [TurnstileService],
  exports: [TurnstileService],
})
export class TurnstileModule {}
