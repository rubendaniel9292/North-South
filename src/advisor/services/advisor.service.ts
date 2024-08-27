import { AdvisdorEntity } from './../entity/advisor.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidateEntity } from '@/helpers/validations';
import { ErrorManager } from '@/helpers/error.manager';
import { AdvisorDTO } from '../dto/advisor.dto';
@Injectable()
export class AdvisorService extends ValidateEntity {
  constructor(
    @InjectRepository(AdvisdorEntity)
    private readonly advisdorRepository: Repository<AdvisdorEntity>,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(advisdorRepository);
  }
  //1:metodo para registrar un cliente
  public createAdvisor = async (body: AdvisorDTO): Promise<AdvisdorEntity> => {
    try {
      // Primero validamos cédula y correo
      console.log('Valor recibido desde Postman:', body.personalData);
      // Convertir el valor de personalData a booleano
      //body.personalData = body.personalData === 'true' || body.personalData === true;
      await this.validateInput(body, 'advisor');
      const newAdvisor = await this.advisdorRepository.save(body);
      console.log(body.personalData);
      //consulta futura para la eliminacion del usuario no se aconseja en produccion
      //await this.customersRepository.query(`TRUNCATE TABLE customers RESTART IDENTITY CASCADE`);

      console.log(newAdvisor);
      console.log('After Save:', newAdvisor.personalData);
      return newAdvisor;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
