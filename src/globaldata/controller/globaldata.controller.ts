import { GlobaldataService } from './../services/globaldata.service';
import { Controller, Get } from '@nestjs/common';

@Controller('globaldata')
export class GlobaldataController {
  constructor(private readonly globaldataService: GlobaldataService) {}
  //1: metodo para obetener el listado de provincias
  @Get('get-provinces')
  public async getProvince() {
    const allProvince = await this.globaldataService.getAllProvinces();
    if (allProvince) {
      return {
        status: 'success',
        allProvince,
      };
    }
  }

  @Get('get-city')
  public async getCities() {
    const allCities = await this.globaldataService.getAllCities();
    if (allCities) {
      return {
        status: 'success',
        allCities,
      };
    }
  }

  @Get('civil-status')
  public async getCivil() {
    const allStatus = await this.globaldataService.getAllCivilStatus();
    if (allStatus) {
      return {
        status: 'success',
        allStatus,
      };
    }
  }
}
