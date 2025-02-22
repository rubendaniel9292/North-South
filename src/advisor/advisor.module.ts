import { Module } from '@nestjs/common';
import { AdvisorService } from './services/advisor.service';
import { AdvisorController } from './controller/advisor.controller';
import { AdvisorEntity } from './entities/advisor.entity';
import { ProvidersModule } from '@/providers/providers.module';
import { UserModule } from '@/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpCustomService } from '@/providers/http/http.service';
import { UserService } from '@/user/services/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdvisorEntity]),
    ProvidersModule,
    UserModule,
  ],
  providers: [AdvisorService, UserService, HttpCustomService],
  controllers: [AdvisorController],
  exports: [AdvisorService, TypeOrmModule],
})
export class AdvisorModule { }
