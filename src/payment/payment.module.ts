import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpCustomService } from 'src/providers/http/http.service';
import { UserModule } from '@/user/user.module';
import { ProvidersModule } from 'src/providers/providers.module';
import { PaymentEntity } from './entity/payment.entity';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controller/payment.controller';
import { PolicyEntity } from '@/policy/entities/policy.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, PolicyEntity]), // Importa y configura ScheduleModule para tareas automaticas
    ProvidersModule,
    UserModule,
  ],
  providers: [PaymentService, HttpCustomService],
  exports: [PaymentService, TypeOrmModule],
  controllers: [PaymentController],
})
export class PaymentModule {}