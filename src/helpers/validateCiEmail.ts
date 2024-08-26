import { CustomersEntity } from '@/customers/entities/customer.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorManager } from './error.manager';
import { AdvisdorEntity } from '@/advisor/entity/advisor.entity';
import { CompanyEntity } from '@/company/entities/company.entity';
@Injectable()
export class ValidateCiEmailService {
  constructor(
    @InjectRepository(CustomersEntity)
    @InjectRepository(AdvisdorEntity)
    @InjectRepository(CompanyEntity)
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
          message: 'La cédula o RUC ya está registrado',
        });
      }

      const existingCompany = await this.validateRepository.findOne({
        where: { companyName: body.companyName!.toLowerCase() },
      });

      if (existingCompany) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'La compañía ya está registrada',
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
