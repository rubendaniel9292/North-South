import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { CustomerDTO } from '../dto/customer.dto';
import { Repository } from 'typeorm';
import { ErrorManager } from 'src/helpers/error.manager';
import { CustomersEntity } from '../entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomersEntity)
    private readonly customerRepository: Repository<CustomersEntity>,
  ) {}
  //1:metodo para registrar un cliente
  public createCustomer = async (
    body: CustomerDTO,
  ): Promise<CustomersEntity> => {
    try {
      //convertir la cedula o ruc a string
      //const customer = new CustomersEntity();
      //customer.id = Number(body.province_id);
      //customer.ci_ruc = String(body.ci_ruc); // inputCiRuc es el número recibido
      // Verificar si el correo ya existe registrado
      //body.email! le dice al compilador que body.email no es null ni undefined
      const existingCiRuc = await this.customerRepository.findOne({
        where: { ci_ruc: body.ci_ruc!.toLowerCase() },
      });

      if (existingCiRuc) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'La cédula  ya está registrada',
        });
      }
      const existingEmail = await this.customerRepository.findOne({
        where: { email: body.email!.toLowerCase() },
      });
      if (existingEmail) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El correo  ya está registrado',
        });
      }

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
