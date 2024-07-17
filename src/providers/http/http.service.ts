import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HttpCustomService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  //priovider del tipo http con axios para el manejo de solicitudes a la api,

  async fetchDataFromExternalApi(endpoint: string): Promise<any> {
    try {
      const apiUrl = this.configService.get<string>('URL'); // Obtiene la URL base de la variable de entorno
      const url = `${apiUrl}${endpoint}`;
      const response = await lastValueFrom(this.httpService.get(url));
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching data: ${error.message}`);
    }
  }
}
