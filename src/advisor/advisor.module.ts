import { Module } from '@nestjs/common';
import { AdvisorService } from './services/advisor.service';
import { AdvisorController } from './controller/advisor.controller';
import { AdvisdorEntity } from './entity/advisor.entity';
import { ProvidersModule } from '@/providers/providers.module';
import { UserModule } from '@/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdvisdorEntity]),
    ProvidersModule,
    UserModule,
  ],
  providers: [AdvisorService],
  controllers: [AdvisorController],
  exports: [AdvisorService, TypeOrmModule],
})
export class AdvisorModule {}
