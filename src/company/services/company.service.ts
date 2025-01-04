import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyDTO } from '../dto/company.dto';
import { ErrorManager } from '@/helpers/error.manager';
import { CompanyEntity } from '../entities/company.entity';
import { ValidateEntity } from '@/helpers/validations';

@Injectable()
export class CompanyService extends ValidateEntity {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(companyRepository);
  }
  //1:metodo para registrar una compañia       
  public createCompany = async (body: CompanyDTO): Promise<CompanyEntity> => {
    try {
      // Primero validamos cédula o ruc
      await this.validateInput(body, 'company');
      const newCompany = await this.companyRepository.save(body);
      console.log(newCompany);

      return newCompany;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2: metodo para buscar las compañias asesoras
  public getAllCompanies = async () => {
    try {
      const allCompany = await this.companyRepository.find();
      return allCompany;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
