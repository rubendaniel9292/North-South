import { ValidateCiEmailService } from '@/helpers/validateCiEmail';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyDTO } from '../dto/company.dto';
import { ErrorManager } from '@/helpers/error.manager';
import { CompanyEntity } from '../entities/company.entity';

@Injectable()
export class CompanyService extends ValidateCiEmailService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(companyRepository);
  }
  //1:metodo para registrar un cliente
  public createCompany = async (body: CompanyDTO): Promise<CompanyEntity> => {
    try {
      // Primero validamos cédula o ruc
      console.log('Valor recibido desde Postman:', body);
      // Convertir el valor de personalData a booleano
      //body.personalData = body.personalData === 'true' || body.personalData === true;
      await this.validateCiEmail(body);
      const newCompany = await this.companyRepository.save(body);
      console.log(newCompany);
      //consulta futura para la eliminacion del usuario no se aconseja en produccion
      //await this.customersRepository.query(`TRUNCATE TABLE customers RESTART IDENTITY CASCADE`);

      console.log(newCompany);

      return newCompany;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
