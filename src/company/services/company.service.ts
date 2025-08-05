import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyDTO } from '../dto/company.dto';
import { ErrorManager } from '@/helpers/error.manager';
import { CompanyEntity } from '../entities/company.entity';
import { ValidateEntity } from '@/helpers/validations';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';

@Injectable()
export class CompanyService extends ValidateEntity {
  private readonly logger = new Logger(CompanyService.name);
  private readonly CACHE_TTL = 3600; // 1 hora en segundos

  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly redisService: RedisModuleService,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(companyRepository);
  }
  //1:metodo para registrar una compañia       
  public createCompany = async (body: CompanyDTO): Promise<CompanyEntity> => {
    try {
      this.logger.log(`Iniciando registro de compañía: ${body.companyName}`);

      // Primero validamos cédula o ruc
      await this.validateInput(body, 'company');
      
      const newCompany = await this.companyRepository.save(body);
      this.logger.log(`Compañía registrada exitosamente con ID: ${newCompany.id}`);

      // Guardar en Redis (con TTL para consistencia)
      await this.redisService.set(`company:${newCompany.id}`, newCompany, this.CACHE_TTL);

      // Invalidar el caché de todas las compañías para evitar inconsistencias
      await this.redisService.del(CacheKeys.GLOBAL_COMPANY);
      this.logger.log('Cache de compañías invalidado');

      return newCompany;
    } catch (error) {
      this.logger.error(`Error al registrar compañía: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2: metodo para buscar las compañias asesoras
  public getAllCompanies = async (): Promise<CompanyEntity[]> => {
    try {
      this.logger.log('Consultando todas las compañías');

      // Verificar cache primero
      const cachedCompany = await this.redisService.get(CacheKeys.GLOBAL_COMPANY);
      if (cachedCompany) {
        this.logger.log('Compañías obtenidas desde cache');
        return cachedCompany;
      }

      // Consultar base de datos
      const allCompany: CompanyEntity[] = await this.companyRepository.find({
        order: { id: 'DESC' }, // Ordenar por ID descendente (más recientes primero)
      });

      if (allCompany.length === 0) {
        this.logger.warn('No se encontraron compañías registradas');
        throw new ErrorManager({
          type: 'NOT_FOUND',
          message: 'No se encontraron compañías registradas',
        });
      }

      // Guardar en cache
      await this.redisService.set(CacheKeys.GLOBAL_COMPANY, allCompany, this.CACHE_TTL);
      this.logger.log(`Se encontraron ${allCompany.length} compañías`);

      return allCompany;
    } catch (error) {
      this.logger.error(`Error al consultar compañías: ${error.message}`, error.stack);
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
