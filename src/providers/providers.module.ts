import { Module } from '@nestjs/common';
import { HttpCustomService } from './http/http.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [HttpCustomService],
  exports: [HttpModule, HttpCustomService],
})
export class ProvidersModule {}
/* 
imports: Importa HttpModule de @nestjs/axios, que proporciona la funcionalidad de Axios.
providers: Registra HttpCustomService como un proveedor.
exports: Hace que HttpModule y HttpCustomService estén disponibles para otros módulos que importen ProvidersModule.*/
