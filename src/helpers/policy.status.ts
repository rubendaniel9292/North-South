import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyEntity } from '@/policy/entities/policy.entity';
import { PolicyStatusEntity } from '@/policy/entities/policy_status.entity';
import { Cron } from '@nestjs/schedule';
import { PolicyService } from '@/policy/services/policy.service';
@Injectable()
export class PolicyStatusService implements OnModuleInit {
  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    @InjectRepository(PolicyStatusEntity)
    private readonly policyStatusRepository: Repository<PolicyStatusEntity>,
    @Inject(forwardRef(() => PolicyService))
    private readonly policyService: PolicyService,
  ) { }

  //1: Método para determinar el estado de la poliza basado en la fecha de culminacion
  async determinePolicyStatus(policy: PolicyEntity): Promise<PolicyStatusEntity> {
    // Normalizar fechas para comparación
    const currentDate = new Date();
    const normalizedCurrentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    // Calcular fecha un mes adelante
    const oneMonthAhead = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    );
    /*
        const nextMonthStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1,
        );
        */
    // Normalizar la fecha de finalización
    const endDate = new Date(policy.endDate);
    const normalizedEndDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    //console.log('Fecha actual normalizada:', normalizedCurrentDate);
    //console.log('Fecha un mes adelante:', oneMonthAhead);
    //console.log('Fecha de finalización normalizada:', normalizedEndDate);

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
    /*
        console.log('Estados obtenidos:', {
          closeToCompletion,
          completedStatus,
          activeStatus,
        });
        */
    // Lógica para determinar el estado
    // Lógica para determinar el estado

    if (policy.policy_status_id === 2) {
      return policy.policyStatus; // Mantener el estado cancelado
    } else if (normalizedEndDate.getTime() <= normalizedCurrentDate.getTime()) {
      return completedStatus; // La poliza ha culminado (hoy o antes)
    } else if (normalizedEndDate.getTime() <= oneMonthAhead.getTime()) {
      return closeToCompletion; // La poliza esta por culminar (dentro de un mes)
    } else {
      return activeStatus; // La poiliza esta activa o vigente
    }
  }
  //2: Método para determinar el estado de una nueva póliza basada en la fecha de culminación
  async determineNewPolicyStatus(endDate: Date): Promise<PolicyStatusEntity> {
    // Normalizar fechas para comparación
    const currentDate = new Date();
    const normalizedCurrentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    // Calcular fecha un mes adelante
    const oneMonthAhead = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    );

    // Normalizar la fecha de finalización
    const normalizedEndDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
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
    if (normalizedEndDate.getTime() <= normalizedCurrentDate.getTime()) {
      return completedStatus; // La poliza ha culminado (hoy o antes)
    } else if (normalizedEndDate.getTime() <= oneMonthAhead.getTime()) {
      return closeToCompletion; // La poliza esta por culminar (dentro de un mes)
    } else {
      return activeStatus; // La poiliza esta activa o vigente
    }
  }

  @Cron('0 0 1 * *') // Ejecuta a medianoche el primer día de cada mes
  //@Cron('0 * * * *') // Ejecuta a minuto 0 de cada hora
  async updatePolicyStatuses(): Promise<void> {
    const policies = await this.policyRepository.find();
    let totalProcessed = 0;
    let statusUpdated = 0;
    let cancelledSkipped = 0;
    let cleanedUp = 0;

    for (const policy of policies) {
      totalProcessed++;

      // Ignorar pólizas canceladas (id: 2)
      if (policy.policy_status_id == 2) {
        cancelledSkipped++;
        continue;
      }

      const oldStatusId = policy.policy_status_id;
      const newStatus = await this.determinePolicyStatus(policy);

      // Solo actualizar si el estado ha cambiado
      if (oldStatusId !== newStatus.id) {
        await this.policyRepository.update(policy.id, {
          policy_status_id: newStatus.id,
        });
        statusUpdated++;

        // Si cambió a Culminada (3), limpiar datos posteriores
        if (newStatus.id === 3) {
          try {
            // Recargar la póliza con el nuevo estado
            const updatedPolicy = await this.policyRepository.findOne({ where: { id: policy.id } });
            if (updatedPolicy) {
              await this.policyService.validateAndCleanupPayments(updatedPolicy);
              cleanedUp++;
              console.log(`   🧹 Póliza ${policy.id} culminada - datos limpiados`);
            }
          } catch (error) {
            console.error(`   ❌ Error limpiando póliza ${policy.id}:`, error.message);
          }
        }
      }
    }

    // Log consolidado solo si hay cambios importantes
    if (statusUpdated > 0 || totalProcessed > 0) {
      console.log(`✅ Estados de pólizas actualizados: ${totalProcessed} procesadas, ${statusUpdated} actualizadas, ${cleanedUp} limpiadas, ${cancelledSkipped} canceladas omitidas`);
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
    console.log('✅ Estados de pólizas inicializados correctamente');
  }
}
