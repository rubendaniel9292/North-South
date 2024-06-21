import { Module } from '@nestjs/common';
import { ServicesService } from './services/services.service';
import { ControllesController } from './controlles/controlles.controller';

@Module({
  providers: [ServicesService],
  controllers: [ControllesController]
})
export class UsersModule {}
