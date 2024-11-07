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
import { PolicyTypeEntity } from './entities/policy_type.entity';
import { PaymentFrequencyEntity } from './entities/payment_frequency.entity';
import { PaymentMethodEntity } from './entities/payment_method.entity';
//import { PdfService } from '@/helpers/pdf.report';
import { GenerateReportPdfService } from '@/generate-report-pdf/services/generate-report-pdf.service';
import { RenewalEntity } from './entities/renewal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PolicyEntity,
      UserService,
      HttpCustomService,
      PolicyStatusEntity,
      PolicyStatusService,
      PolicyTypeEntity,
      PaymentFrequencyEntity,
      PaymentMethodEntity,
      RenewalEntity,
    ]),
    ProvidersModule,
    UserModule,
  ],
  providers: [
    PolicyService,
    HttpCustomService,
    PolicyStatusService,
    //PdfService, //para usar el helper
    GenerateReportPdfService,
  ],
  controllers: [PolicyController],
  exports: [PolicyService, TypeOrmModule, PolicyStatusService],
})
export class PolicyModule {}
