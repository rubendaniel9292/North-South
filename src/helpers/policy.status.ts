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
  async determinePolicyStatus(policy: PolicyEntity): Promise<PolicyStatusEntity> {
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
    // Lógica para determinar el estado
    // Lógica para determinar el estado
    if (policy.policy_status_id === 2) {
      return policy.policyStatus; // Mantener el estado cancelado
    } else if (policy.endDate.getTime() < currentDate.getTime()) {
      return completedStatus; // La poliza ha culminado
    } else if (policy.endDate.getTime() >= currentMonthStart.getTime() && policy.endDate.getTime() < nextMonthStart.getTime()) {
      return closeToCompletion; // La poliza esta por culminar
    } else {
      return activeStatus; // La poiliza esta activa o vigente
    }
  }
  //2: Método para determinar el estado de una nueva póliza basada en la fecha de culminación
  async determineNewPolicyStatus(endDate: Date): Promise<PolicyStatusEntity> {
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

    // Obtener los estados correspondientes en base a id: vigente por caducar caducada
    const [
      activeStatus,
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

    // Lógica para determinar el estado
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
      // Ignorar pólizas canceladas (id: 2)
      if (policy.policy_status_id == 2) {
        console.log(`Póliza ${policy.id} está CANCELADA. No se modificará su estado.`);
        continue;
      }
      const endDate = new Date(policy.endDate);
      const newStatus = await this.determinePolicyStatus(policy);
      console.log(`Póliza ${policy.id} - Fecha de culminación: ${endDate} - Nuevo estado: ${newStatus.id}`);
      // Solo actualizar si el estado ha cambiado
      if (policy.policy_status_id !== newStatus.id) {
        await this.policyRepository.update(policy.id, {
          policy_status_id: newStatus.id,
        });
        console.log(`Póliza ${policy.id} actualizada al estado: ${newStatus.id}`);
      }
    }
  }

  //para probar la actualización sin esperar al cron.este metodo puede ser llamado manualmente desde un controlador o consola
  async testUpdatePolicyStatuses(): Promise<void> {
    await this.updatePolicyStatuses();
  }

  // Método que se ejecuta cada inicio del servidor
  async onModuleInit(): Promise<void> {
    console.log('Inicializando y actualizando estados de las pólizas...');
    await this.updatePolicyStatuses(); // Llamar a la lógica para actualizar los estados
  }
}
