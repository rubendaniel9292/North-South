import { Module } from '@nestjs/common';
import { CommissionsPaymentsController } from './controller/commissions-payments.controller';
import { CommissionsPaymentsService } from './services/commissions-payments.service';
import { CompanyEntity } from '@/company/entities/company.entity';
import { PaymentMethodEntity } from '@/policy/entities/payment_method.entity';
import { HttpCustomService } from '@/providers/http/http.service';
import { ProvidersModule } from '@/providers/providers.module';
import { UserService } from '@/user/services/user.service';
import { UserModule } from '@/user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisorEntity } from '@/advisor/entities/advisor.entity';
import { AdvisorModule } from '@/advisor/advisor.module';
import { CompanyModule } from '@/company/company.module';
import { CommissionsPaymentsEntity } from './entities/CommissionsPayments.entity';
import { PolicyEntity } from '@/policy/entities/policy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserService,
      HttpCustomService,
      PaymentMethodEntity,
      AdvisorEntity,
      CompanyEntity,
      CommissionsPaymentsEntity,
      PolicyEntity
    ]),
    ScheduleModule.forRoot(),
    ProvidersModule,
    UserModule,
    AdvisorModule,
    CompanyModule,
    PaymentMethodEntity,
  ],
  providers: [CommissionsPaymentsService],
  controllers: [CommissionsPaymentsController],
  exports: [CommissionsPaymentsService],
})
export class CommissionsPaymentsModule { }
