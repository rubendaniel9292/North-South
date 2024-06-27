import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controller/auth.controller';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/services/user.service';

@Module({
  imports: [UserModule],
  providers: [AuthService, UserService],
  controllers: [AuthController],
})
export class AuthModule {}
