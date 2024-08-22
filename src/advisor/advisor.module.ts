import { Module } from '@nestjs/common';
import { AdvisorService } from './services/advisor.service';
import { AdvisorController } from './controller/advisor.controller';

@Module({
  providers: [AdvisorService],
  controllers: [AdvisorController]
})
export class AdvisorModule {}
