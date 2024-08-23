//import { CustomerDTO } from '@/customers/dto/customer.dto';
import { CustomersEntity } from '@/customers/entities/customer.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
//import { Repository } from 'typeorm';
import { ErrorManager } from './error.manager';
import { AdvisdorEntity } from '@/advisor/entity/advisor.entity';
//import { AdvisdorEntity } from '@/advisor/entity/advisor.entity';

@Injectable()
export class ValidateCiEmailService {
  constructor(
    @InjectRepository(CustomersEntity)
    @InjectRepository(AdvisdorEntity)
    protected readonly validateRepository: any,
  ) {}
  protected validateCiEmail = async (body: any): Promise<void> => {
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
