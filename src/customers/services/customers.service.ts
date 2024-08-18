import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { CustomerDTO } from '../dto/customer.dto';
import { Repository } from 'typeorm';
import { ErrorManager } from 'src/helpers/error.manager';
import { CustomersEntity } from '../entities/customer.entity';
import { ValidateCiEmailService } from 'src/helpers/validateCiEmail';

@Injectable()
export class CustomersService extends ValidateCiEmailService {
  constructor(
    @InjectRepository(CustomersEntity)
    private readonly customerRepository: Repository<CustomersEntity>,
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(customerRepository);
  }
  //1:metodo para registrar un cliente
  public createCustomer = async (
    body: CustomerDTO,
  ): Promise<CustomersEntity> => {
    try {
      // Primero validamos cédula y correo
      await this.validateCiEmail(body);
      const newCustomer = await this.customerRepository.save(body);
      //consulta futura para la eliminacion del usuario no se aconseja en produccion
      //await this.customersRepository.query(`TRUNCATE TABLE customers RESTART IDENTITY CASCADE`);

      console.log(newCustomer);
      return newCustomer;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
