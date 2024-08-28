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
}
