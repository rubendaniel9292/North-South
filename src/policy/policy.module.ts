import { Module } from '@nestjs/common';
import { PolicyService } from './services/policy/policy.service';
import { PolicyController } from './controller/policy/policy.controller';

@Module({
  providers: [PolicyService],
  controllers: [PolicyController],
})
export class PolicyModule {}
