import { ErrorManager } from './error.manager';
import { Repository } from 'typeorm';

export class ValidateEntity {
  constructor(protected readonly validateRepository: Repository<any>) {}
  protected validateInput = async (
    body: any,
    entityType: 'customer' | 'advisor' | 'company' | 'policy',
  ): Promise<void> => {
    try {
      /*
      esto es útil para asegurarse de que body.email y otros campos sean accesibles antes de intentar 
      convertirlos a minúsculas, evitando errores si esos campos no están definidos en el objeto body
      */
      // Validación para customer y advisor
      if (entityType === 'customer' || entityType === 'advisor') {
        const existingCiRuc = await this.validateRepository.findOne({
          where: { ci_ruc: body.ci_ruc! },
        });

        if (existingCiRuc) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'La cédula o RUC ya está registrado',
          });
        }

        // VALIDACIÓN DE EMAIL REMOVIDA - Permite correos duplicados
        // Esto es útil para casos donde múltiples clientes pueden compartir
        // el mismo email (familiares, representantes legales, etc.)
        /*
        const existingEmail = await this.validateRepository.findOne({
          where: { email: body.email?.toLowerCase() },
        });
        if (existingEmail) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'El correo ya está registrado',
          });
        }
        */
      }
      if (entityType === 'company') {
        body.companyName.toUpperCase();
        const existingCompany = await this.validateRepository.findOne({
          where: { companyName: body.companyName?.toUpperCase() },
        });

        if (existingCompany) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'La compañía ya está registrada',
          });
        }
        /*
        indica al compilador que estás seguro de que body.ci_ruc no será null ni undefined
        */

        const existingCiRuc = await this.validateRepository.findOne({
          where: { ci_ruc: body.ci_ruc! },
        });

        if (existingCiRuc) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'La cédula o RUC ya está registrado',
          });
        }
      }

      if (entityType === 'policy') {
        body.numberPolicy.toUpperCase();
        const existingPolicy = await this.validateRepository.findOne({
          where: { numberPolicy: body.numberPolicy?.toUpperCase() },
        });

        if (existingPolicy) {
          throw new ErrorManager({
            type: 'BAD_REQUEST',
            message: 'La póliza ya está registrada',
          });
        }
      }
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
