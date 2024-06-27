import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './services/user.service';
import { UserEntity } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
