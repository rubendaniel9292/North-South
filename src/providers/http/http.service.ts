import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ErrorManager } from '@/helpers/error.manager';
import { AxiosResponse, AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpCustomService {
  private readonly logger = new Logger(HttpCustomService.name);
  private readonly baseUrl: string;
  private readonly defaultTimeout: number = 10000; // 10 segundos

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('URL') || '';
    //this.logger.log(`HttpCustomService inicializado con baseUrl: ${this.baseUrl}`);
  }

  /**
   * Realiza una petición GET a un endpoint externo
   * @param endpoint - Ruta del endpoint
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos de la respuesta
   */
  async get<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      //this.logger.log(`Iniciando petición GET a: ${endpoint}`);
      
      const url = this.buildUrl(endpoint);
      const requestConfig: AxiosRequestConfig = {
        timeout: this.defaultTimeout,
        ...config,
      };

      const response: AxiosResponse<T> = await lastValueFrom(
        this.httpService.get<T>(url, requestConfig)
      );

     // this.logger.log(`Petición GET exitosa a: ${endpoint} - Status: ${response.status}`);
      return response.data;

    } catch (error) {
     //this.logger.error(`Error en petición GET a ${endpoint}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(`Error en petición HTTP GET: ${error.message}`);
    }
  }

  /**
   * Realiza una petición POST a un endpoint externo
   * @param endpoint - Ruta del endpoint
   * @param data - Datos a enviar en el body
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos de la respuesta
   */
  async post<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      //this.logger.log(`Iniciando petición POST a: ${endpoint}`);
      
      const url = this.buildUrl(endpoint);
      const requestConfig: AxiosRequestConfig = {
        timeout: this.defaultTimeout,
        ...config,
      };

      const response: AxiosResponse<T> = await lastValueFrom(
        this.httpService.post<T>(url, data, requestConfig)
      );

      //this.logger.log(`Petición POST exitosa a: ${endpoint} - Status: ${response.status}`);
      return response.data;

    } catch (error) {
     // this.logger.error(`Error en petición POST a ${endpoint}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(`Error en petición HTTP POST: ${error.message}`);
    }
  }

  /**
   * Realiza una petición PUT a un endpoint externo
   * @param endpoint - Ruta del endpoint
   * @param data - Datos a enviar en el body
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos de la respuesta
   */
  async put<T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      //this.logger.log(`Iniciando petición PUT a: ${endpoint}`);
      
      const url = this.buildUrl(endpoint);
      const requestConfig: AxiosRequestConfig = {
        timeout: this.defaultTimeout,
        ...config,
      };

      const response: AxiosResponse<T> = await lastValueFrom(
        this.httpService.put<T>(url, data, requestConfig)
      );

      //this.logger.log(`Petición PUT exitosa a: ${endpoint} - Status: ${response.status}`);
      return response.data;

    } catch (error) {
      //this.logger.error(`Error en petición PUT a ${endpoint}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(`Error en petición HTTP PUT: ${error.message}`);
    }
  }

  /**
   * Realiza una petición DELETE a un endpoint externo
   * @param endpoint - Ruta del endpoint
   * @param config - Configuración adicional de Axios
   * @returns Promise con los datos de la respuesta
   */
  async delete<T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      //this.logger.log(`Iniciando petición DELETE a: ${endpoint}`);
      
      const url = this.buildUrl(endpoint);
      const requestConfig: AxiosRequestConfig = {
        timeout: this.defaultTimeout,
        ...config,
      };

      const response: AxiosResponse<T> = await lastValueFrom(
        this.httpService.delete<T>(url, requestConfig)
      );

      //this.logger.log(`Petición DELETE exitosa a: ${endpoint} - Status: ${response.status}`);
      return response.data;

    } catch (error) {
      //this.logger.error(`Error en petición DELETE a ${endpoint}: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(`Error en petición HTTP DELETE: ${error.message}`);
    }
  }

  /**
   * Método de compatibilidad hacia atrás
   * @deprecated Usar el método get() en su lugar
   */
  async fetchDataFromExternalApi(endpoint: string): Promise<any> {
    this.logger.warn('Método fetchDataFromExternalApi está deprecated. Usar get() en su lugar.');
    return this.get(endpoint);
  }

  /**
   * Construye la URL completa combinando baseUrl y endpoint
   * @param endpoint - Ruta del endpoint
   * @returns URL completa
   */
  private buildUrl(endpoint: string): string {
    if (!this.baseUrl) {
      throw new ErrorManager({
        type: 'BAD_REQUEST',
        message: 'URL base no configurada. Verificar variable de entorno URL.',
      });
    }

    // Asegurar que endpoint empiece con /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Remover / final de baseUrl si existe
    const normalizedBaseUrl = this.baseUrl.endsWith('/') 
      ? this.baseUrl.slice(0, -1) 
      : this.baseUrl;

    return `${normalizedBaseUrl}${normalizedEndpoint}`;
  }

  /**
   * Obtiene la configuración actual del servicio
   * @returns Configuración del servicio
   */
  getConfig(): { baseUrl: string; timeout: number } {
    return {
      baseUrl: this.baseUrl,
      timeout: this.defaultTimeout,
    };
  }
}
