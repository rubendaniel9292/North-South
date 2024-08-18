import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { CustomerDTO } from 'src/customers/dto/customer.dto';
import { CustomersEntity } from 'src/customers/entities/customer.entity';

import { Repository } from 'typeorm';
import { ErrorManager } from './error.manager';

@Injectable()
export class ValidateCiEmailService {
  constructor(
    @InjectRepository(CustomersEntity)
    protected readonly validateRepository: Repository<CustomersEntity>,
  ) {}
  public validateCiEmail = async (body: CustomerDTO): Promise<void> => {
    try {
      const existingCiRuc = await this.validateRepository.findOne({
        where: { ci_ruc: body.ci_ruc!.toLowerCase() },
      });

      if (existingCiRuc) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'La cédula  ya está registrada',
        });
      }
      const existingEmail = await this.validateRepository.findOne({
        where: { email: body.email!.toLowerCase() },
      });
      if (existingEmail) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'El correo  ya está registrado',
        });
      }
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
