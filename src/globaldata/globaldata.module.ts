import { Module } from '@nestjs/common';
import { GlobaldataService } from './services/globaldata.service';
import { GlobaldataController } from './controller/globaldata.controller';
import { ProvinceEntity } from '@/globalentites/provincie.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CivilStatusEntity } from '@/globalentites/civilstatus.entity';
import { CityEntity } from '@/globalentites/city.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProvinceEntity, CivilStatusEntity, CityEntity]),
  ],
  providers: [GlobaldataService],
  controllers: [GlobaldataController],
  exports: [GlobaldataService, TypeOrmModule],
})
export class GlobaldataModule {}
