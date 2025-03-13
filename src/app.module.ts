import { PaymentMethod } from './policy/dto/payment_method.dto';
import { BankAccountService } from './bankaccount/services/bankaccount.service';
import { Module, OnModuleInit } from '@nestjs/common';
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
import { RedisModuleModule } from './redis-module/redis-module.module';
import { RedisModuleService } from './redis-module/services/redis-module.service';
import { GlobaldataService } from './globaldata/services/globaldata.service';
import { PolicyService } from './policy/services/policy.service';
import { CommissionsPaymentsModule } from './commissions-payments/commissions-payments.module';


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
    RedisModuleModule,
    CommissionsPaymentsModule,
  ],
})
export default class AppModule implements OnModuleInit {
  constructor(
    private readonly redisService: RedisModuleService,
    private readonly provinceService: GlobaldataService, // Inyecta los servicios
    private readonly cityService: GlobaldataService,
    private readonly civilStatusService: GlobaldataService,
    private readonly allBanksService: BankAccountService,
    private readonly allTypesAccountsService: BankAccountService,
    private readonly policyTypeService: PolicyService,
    private readonly paymentMethodService: PolicyService,
    private readonly payementFrecuencyService: PolicyService,
    private readonly policyStatusRepository: PolicyService
  ) { }
  async onModuleInit() {
    // Limpiar todos los datos de la caché al iniciar el servidor
    await this.redisService.flushAll();

    // Precargar datos estáticos usando las claves del enum
    await this.provinceService.getAllProvinces(); // CacheKeys.PROVINCES
    await this.cityService.getAllCities(); // CacheKeys.CITIES
    await this.civilStatusService.getAllCivilStatus(); // CacheKeys.CIVIL_STATUS
    await this.allBanksService.findBanks();
    await this.allTypesAccountsService.findTypeAccounts();
    await this.paymentMethodService.getPaymentMethod();
    await this.policyTypeService.getTypesPolicies();
    await this.payementFrecuencyService.getFrecuencyPolicies();
    await this.policyStatusRepository.getPolicyStatus();
    process.env.TZ = 'America/Guayaquil'; // Configura la zona horaria
    console.log('Zona horaria configurada:');
    console.log('Fecha actual:', new Date());
  }


}
