import { Module } from '@nestjs/common';
import { PolicyEntity } from './entities/policy.entity';
import { ProvidersModule } from '@/providers/providers.module';
import { UserModule } from '@/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '@/user/services/user.service';
import { HttpCustomService } from '@/providers/http/http.service';
import { PolicyService } from './services/policy.service';
import { PolicyController } from './controller/policy.controller';
import { PolicyStatusEntity } from './entities/policy_status.entity';
import { PolicyStatusService } from '@/helpers/policy.status';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PolicyEntity,
      UserService,
      HttpCustomService,
      PolicyStatusEntity,
      PolicyStatusService,
    ]),
    ProvidersModule,
    UserModule,
  ],
  providers: [PolicyService, HttpCustomService, PolicyStatusService],
  controllers: [PolicyController],
  exports: [PolicyService, TypeOrmModule, PolicyStatusService],
})
export class PolicyModule {}
