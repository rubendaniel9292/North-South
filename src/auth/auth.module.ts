import { Module } from '@nestjs/common';
import { CreditcardModule } from '@/creditcard/creditcard.module';
import { CustomersModule } from '@/customers/customers.module';
import { ProvidersModule } from '@/providers/providers.module';
import { UserModule } from '@/user/user.module';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './services/auth.service';

@Module({
  imports: [UserModule, CustomersModule, ProvidersModule, CreditcardModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
