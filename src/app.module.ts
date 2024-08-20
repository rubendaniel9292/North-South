import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DataSourceConfig } from './config/data.source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
//import { HttpModule } from '@nestjs/axios';
//import { ProvidersModule } from './providers/providers.module';
import { CustomersModule } from './customers/customers.module';
import { CompanyModule } from './company/company.module';
import { CreditcardModule } from './creditcard/creditcard.module';

@Module({
  imports: [
    //lee y setea las variables de entorno
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({ ...DataSourceConfig }),
    UserModule,
    AuthModule,
    CustomersModule,
    CompanyModule,
    CreditcardModule,
  ],
})
export default class AppModule {}
