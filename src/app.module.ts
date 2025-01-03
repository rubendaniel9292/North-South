import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DataSourceConfig } from './config/data.source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { CompanyModule } from './company/company.module';
import { CreditcardModule } from './creditcard/creditcard.module';
import { AdvisorModule } from './advisor/advisor.module';
import { PolicyModule } from './policy/policy.module';
import { GlobaldataModule } from './globaldata/globaldata.module';
import { BankAccountModule } from './bankaccount/bankaccount.module';
import { PaymentModule } from './payment/payment.module';
import { GenerateReportPdfModule } from './generate-report-pdf/generate-report-pdf.module';
import { TurnstileModule } from './turnstile/turnstile.module';

@Module({
  imports: [
    //lee y setea las variables de entorno
    ConfigModule.forRoot({
      //envFilePath: `.${process.env.NODE_ENV}.env`,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}.env`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({ ...DataSourceConfig }),
    UserModule,
    AuthModule,
    CustomersModule,
    CompanyModule,
    CreditcardModule,
    AdvisorModule,
    PolicyModule,
    GlobaldataModule,
    BankAccountModule,
    PaymentModule,
    GenerateReportPdfModule,
    TurnstileModule,
  ],
})
export default class AppModule {}
