import { CustomersModule } from './../customers/customers.module';
import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controller/auth.controller';
import { UserModule } from 'src/user/user.module';
//import { UserService } from 'src/user/services/user.service';
import { ProvidersModule } from 'src/providers/providers.module';
//import { CustomersService } from 'src/customers/services/customers.service';

@Module({
  imports: [UserModule, CustomersModule, ProvidersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
