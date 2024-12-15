import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import axios from 'axios';
import { ErrorManager } from '@/helpers/error.manager';

@Injectable()
export class TurnstileService {
  private readonly SECRET_KEY: string;
  constructor(private readonly configService: ConfigService) {
    this.SECRET_KEY = this.configService.get<string>('TURNSTILE_SECRET_KEY');
  }
  async verifyToken(token: string, ip?: string): Promise<boolean> {
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const formData = new FormData();
    formData.append('secret', this.SECRET_KEY);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    try {
      const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
      });

      const outcome = response.data;
      if (!outcome.success) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: `Turnstile error: ${outcome['error-codes']?.join(', ') || 'Unknown error'}`,
        });
      }
      return outcome.success;
    } catch (error) {
      throw new ErrorManager({
        type: 'BAD_REQUEST',
        message: 'No se pudo verificar el token',
      });
    }
  }
}
