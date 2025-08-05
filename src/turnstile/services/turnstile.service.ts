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
  /**
   * comentarios JSDoc es una buena práctica que mejora la legibilidad, el mantenimiento y la usabilidad del código.
   * Verifica el token de Turnstile utilizando la API de Cloudflare.
   * @param token - El token proporcionado por el cliente.
   * @param ip - (Opcional) La dirección IP del cliente.
   * @returns {Promise<boolean>} - Retorna true si la verificación es exitosa.
   * @throws {ErrorManager} - Lanza un error si la verificación falla.
   */
  async verifyToken(token: string, ip?: string): Promise<boolean> {
    if (!token) {
      throw new ErrorManager({
        type: 'BAD_REQUEST',
        message: 'Token Turnstile vacío o no recibido en la petición',
      });
    }
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const formData = new FormData();
    formData.append('secret', this.SECRET_KEY);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);
    //console.log('Turnstile token recibido:', token);
    try {
      const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
      });

      const outcome = response.data;
      //console.log('Respuesta de Turnstile:', outcome); 
      
      // Si Cloudflare responde correctamente pero el token es inválido
      if (!outcome.success) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: `Turnstile error: ${outcome['error-codes']?.join(', ') || 'Unknown error'}`,
        });
      }
      
      return outcome.success;
    } catch (error) {
      // Solo manejar errores de red/axios, no errores de negocio (ErrorManager)
      if (error instanceof ErrorManager) {
        throw error; // Re-lanzar errores de validación de Turnstile
      }
      
      // Manejar errores de red/conexión
      if (axios.isAxiosError(error) && error.response) {
        console.error('Respuesta de Cloudflare Turnstile:', error.response.data);
      }
      
      throw new ErrorManager({
        type: 'BAD_REQUEST',
        message: 'No se pudo verificar el token TurstLine',
      });
    }
  }
}
