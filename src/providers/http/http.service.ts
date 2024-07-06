import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HttpCustomService {
  constructor(private readonly httpService: HttpService) {}
  //priovider del tipo http con axios para el manejo de apis,

  public apiFindAll = async () => {
    const API_URL = process.env.URL;
    console.log(API_URL);
    if (!API_URL) {
      throw new Error('API URL is not defined in the environment variables');
    }
    const response = await firstValueFrom(this.httpService.get(API_URL));
    return response.data;
  };
}
