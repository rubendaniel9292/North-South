import { Module } from '@nestjs/common';

import { CreditcardController } from './controller/creditcard.controller';

import { ProvidersModule } from 'src/providers/providers.module';
//import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardOptionsEntity } from './entities/cardoptions.entity';
import { CreditcardService } from './services/creditcard.service';
import { HttpCustomService } from 'src/providers/http/http.service';
import { BankEntity } from './entities/bank.entity';
import { CreditCardEntity } from './entities/credit.card.entity';
import { UserModule } from '@/user/user.module';
//import { UserService } from '@/user/services/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CardOptionsEntity, BankEntity, CreditCardEntity]),
    ProvidersModule,
    UserModule,
  ],
  controllers: [CreditcardController],
  providers: [CreditcardService, HttpCustomService],
  exports: [CreditcardService, TypeOrmModule],
})
export class CreditcardModule {}
