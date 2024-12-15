import { Module } from '@nestjs/common';

import { CreditcardController } from './controller/creditcard.controller';

import { ProvidersModule } from 'src/providers/providers.module';
//import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardOptionsEntity } from './entities/cardoptions.entity';
import { CreditcardService } from './services/creditcard.service';
import { HttpCustomService } from 'src/providers/http/http.service';
import { BankEntity } from '../config/bank.entity';
import { CreditCardEntity } from './entities/credit.card.entity';
import { UserModule } from '@/user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CreditCardStatusService } from '@/helpers/card.status';
import { CardStatusEntity } from './entities/card.status.entity';
import { TurnstileModule } from '@/turnstile/turnstile.module';
//import { UserService } from '@/user/services/user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CardOptionsEntity,
      BankEntity,
      CreditCardEntity,
      CreditCardStatusService,
      CardStatusEntity,
      TurnstileModule,
    ]),
    ScheduleModule.forRoot(), // Importa y configura ScheduleModule para tareas automaticas
    ProvidersModule,
    UserModule,
  ],
  controllers: [CreditcardController],
  providers: [CreditcardService, HttpCustomService, CreditCardStatusService],
  exports: [CreditcardService, TypeOrmModule, CreditCardStatusService],
})
export class CreditcardModule {}
