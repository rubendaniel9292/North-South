import { Module } from '@nestjs/common';
import { CompanyService } from './services/company.service';
import { CompanyController } from './controller/company.controller';
import { ProvidersModule } from '@/providers/providers.module';
import { UserModule } from '@/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpCustomService } from '@/providers/http/http.service';
import { UserService } from '@/user/services/user.service';
import { CompanyEntity } from './entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyEntity]),
    ProvidersModule,
    UserModule,
  ],
  providers: [CompanyService, UserService, HttpCustomService],
  controllers: [CompanyController],
  exports: [CompanyService, TypeOrmModule],
})
export class CompanyModule {}
