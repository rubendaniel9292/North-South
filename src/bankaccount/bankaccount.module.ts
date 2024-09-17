import { AccountTypeEntity } from './entities/account-type.entity';
import { Module } from '@nestjs/common';
import { BankAccountService } from './services/bankaccount.service';
import { BankEntity } from '@/config/bank.entity';
import { ProvidersModule } from '@/providers/providers.module';
import { UserModule } from '@/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpCustomService } from '@/providers/http/http.service';
import { BankAccountEntity } from './entities/bank-account.entity';
import { BankaccountController } from './controller/bankaccount.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankEntity,
      AccountTypeEntity,
      BankAccountEntity,
    ]),
    ProvidersModule,
    UserModule,
    ProvidersModule,
    UserModule,
  ],
  providers: [BankAccountService, HttpCustomService],
  exports: [BankAccountService, TypeOrmModule],
  controllers: [BankaccountController],
})
export class BankAccountModule {}
