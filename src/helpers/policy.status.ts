import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { PolicyStatusEntity } from '@/policy/entities/policy_status.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class PolicyStatusService implements OnModuleInit {
  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    @InjectRepository(PolicyStatusEntity)
    private readonly policyStatusRepository: Repository<PolicyStatusEntity>,
  ) { }


  //1: Método para determinar el estado de la poliza basado en la fecha de culminacion
  async determinePolicyStatus(endDate: Date): Promise<PolicyStatusEntity> {
    const currentDate = new Date();
    const currentMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const nextMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1,
    );
    //console.log('Fecha de expiración:', expirationDate);
    //console.log('Inicio del mes actual:', currentMonthStart);
    //console.log('Inicio del próximo mes:', nextMonthStart);

    // Obtener los estados correspondientes en base a id: vigente por caducar caducada
    const [
      activeStatus /*cancelledStatus*/,
      completedStatus,
      closeToCompletion,
    ] = await Promise.all([
      this.policyStatusRepository.findOne({
        where: { id: 1 }, //vigente o activa
      }),
      this.policyStatusRepository.findOne({
        where: { id: 3 }, //culminada
      }),
      this.policyStatusRepository.findOne({
        where: { id: 4 }, //por culminar
      }),
    ]);

    console.log('Estados obtenidos:', {
      closeToCompletion,
      completedStatus,
      activeStatus,
    });

    if (endDate.getTime() < currentDate.getTime()) {
      return completedStatus; // La poliza ha culminado
    } else if (endDate.getTime() >= currentMonthStart.getTime() && endDate.getTime() < nextMonthStart.getTime()) {
      return closeToCompletion; // La poliza esta por culminar
    } else {
      return activeStatus; // La poiliza esta activa o vigente
    }
  }

  @Cron('0 0 1 * *') // Ejecuta a medianoche el primer día de cada mes
  //@Cron('0 * * * *') // Ejecuta a minuto 0 de cada hora
  async updatePolicyStatuses(): Promise<void> {
    const policies = await this.policyRepository.find();

    for (const policy of policies) {
      const endDate = new Date(policy.endDate);
      const newStatus = await this.determinePolicyStatus(endDate);

      if (policy.policy_status_id !== newStatus.id) {
        await this.policyRepository.update(policy.id, {
          policy_status_id: newStatus.id,
        });
      }
    }
  }
  // este metodo puede ser llamado manualmente desde un controlador o consola
  //para probar la actualización sin esperar al cron.
  async testUpdatePolicyStatuses(): Promise<void> {
    await this.updatePolicyStatuses();
  }

  // Método que se ejecuta cada inicio del servidor
  async onModuleInit(): Promise<void> {
    console.log('Inicializando y actualizando estados de las pólizas...');
    await this.updatePolicyStatuses(); // Llamar a la lógica para actualizar los estados
  }
}
