import { ValidateEntity } from '@/helpers/validations';
import { Injectable } from '@nestjs/common';
import { PolicyEntity } from '../entities/policy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { PolicyDTO } from '../dto/policy.dto';
import { PolicyStatusService } from '@/helpers/policy.status';

@Injectable()
export class PolicyService extends ValidateEntity {
  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    private readonly policyStatusService: PolicyStatusService, // Inyectar el servicio existente
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(policyRepository);
  }
  //1:metodo para registrar una poliza
  public createPolicy = async (body: PolicyDTO): Promise<PolicyEntity> => {
    try {
      // Primero validamos cédula y correo

      // Convertir el valor de personalData a booleano
      //body.personalData = body.personalData === 'true' || body.personalData === true;
      await this.validateInput(body, 'policy');
      const endDate = new Date(body.endDate);
      // Reutilizar el método determinePolicyStatus para obtener el estado correcto
      const determinedStatus =
        await this.policyStatusService.determinePolicyStatus(endDate);
      // Asignar el estado determinado al body de la tarjeta
      body.policy_status_id = determinedStatus.id;
      const newPolicy = await this.policyRepository.save(body);
      console.log(newPolicy);

      return newPolicy;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2:metodo para consultas todas las polizas
  public getAllPolicies = async (): Promise<PolicyEntity[]> => {
    try {
      const policies = await this.policyRepository.find({
        relations: [
          'policyType',
          'policyStatus',
          'paymentFrequency',
          'company',
          'advisor',
          'customer',
          'paymentMethod',
          'creditCard',
          'creditCard.bank', // Asegúrate de incluir la relación con el banco,
        ],
        select: {
          id: true,
          numberPolicy: true,
          coverageAmount: true,
          agencyPercentage: true,
          advisorPercentage: true,
          policyValue: true,
          numberOfPayments: true,
          startDate: true,
          endDate: true,
          paymentsToAdvisor: true,
          observations: true,
          policyType: {
            policyName: true,
          },
          policyStatus: {
            statusName: true,
          },
          customer: {
            ci_ruc: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
          paymentFrequency: {
            frequencyName: true,
          },
          company: {
            companyName: true,
          },
          advisor: {
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },

          paymentMethod: {
            methodName: true,
          },
          creditCard: {
            bank_id: true,
            bank: {
              bankName: true, // Asumiendo que el banco tiene un campo 'name'
            },
          },
        },
      });

      return policies;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}