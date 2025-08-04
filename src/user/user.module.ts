import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controller/user.controller';
import { UserService } from './services/user.service';
import { UserEntity } from './entities/user.entity';
import { TaskEntity } from './entities/task.entity';
import { ProvidersModule } from '@/providers/providers.module';
import { HttpCustomService } from '@/providers/http/http.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TaskEntity]), 
    ProvidersModule
  ],
  providers: [
    UserService, 
    HttpCustomService
  ],
  controllers: [UserController],
  exports: [
    UserService, 
    TypeOrmModule
  ],
})
export class UserModule {}
