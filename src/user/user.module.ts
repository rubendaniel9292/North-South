import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './services/user.service';
import { UserEntity } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersModule } from 'src/providers/providers.module';
import { HttpCustomService } from 'src/providers/http/http.service';
import { TaskEntity } from './entities/task.entity';


@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, TaskEntity]), ProvidersModule],
  providers: [UserService, HttpCustomService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
