import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CreditCardEntity } from '@/creditcard/entities/credit.card.entity';
import { CardStatusEntity } from '@/creditcard/entities/card.status.entity';

@Injectable()
export class CreditCardStatusService implements OnModuleInit {
  constructor(
    @InjectRepository(CreditCardEntity)
    private readonly creditCardRepository: Repository<CreditCardEntity>,
    @InjectRepository(CardStatusEntity)
    private readonly cardStatusRepository: Repository<CardStatusEntity>,
  ) { }

  //1: Método para determinar el estado de la tarjeta basado en la fecha de expiración
  async determineCardStatus(expirationDate: Date): Promise<CardStatusEntity> {
    // Normalizar la fecha de expiración (eliminar la parte de la hora)
    const normalizedExpirationDate = new Date(
      expirationDate.getFullYear(),
      expirationDate.getMonth(),
      expirationDate.getDate()
    );

    // Normalizar la fecha actual
    const currentDate = new Date();
    const normalizedCurrentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    // Calcular el primer día del mes actual
    const currentMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Calcular el primer día del próximo mes
    const nextMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );

    // Calcular el primer día del mes siguiente al próximo mes
    const afterNextMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 2,
      1
    );
    /*
        console.log('Fecha de expiración normalizada:', normalizedExpirationDate);
        console.log('Fecha actual normalizada:', normalizedCurrentDate);
        console.log('Inicio del mes actual:', currentMonthStart);
        console.log('Inicio del próximo mes:', nextMonthStart);
        console.log('Inicio del mes después del próximo:', afterNextMonthStart);
    */
    // Obtener los estados correspondientes en base a id: vigente por caducar caducada
    const [activeStatus, aboutToExpireStatus, expiredStatus] =
      await Promise.all([
        this.cardStatusRepository.findOne({
          where: { id: 1 }, //vigente
        }),
        this.cardStatusRepository.findOne({
          where: { id: 2 }, //por caducar
        }),
        this.cardStatusRepository.findOne({
          where: { id: 3 }, //caucada
        }),
      ]);
    if (!expiredStatus || !aboutToExpireStatus || !expiredStatus) {
      console.error(
        'El estado caducado no se encontró en la base de datos. Verificalos',
      );
    }
    /*
        console.log('Estados obtenidos:', {
          expiredStatus,
          aboutToExpireStatus,
          activeStatus,
        });
    */
    // Comparar las fechas normalizadas
    if (normalizedExpirationDate.getTime() < normalizedCurrentDate.getTime()) {
      return expiredStatus; // La tarjeta ha caducado
    } else if (
      normalizedExpirationDate.getTime() >= normalizedCurrentDate.getTime() &&
      normalizedExpirationDate.getTime() < afterNextMonthStart.getTime()
    ) {
      return aboutToExpireStatus; // La tarjeta está por caducar (dentro de los próximos dos meses)
    } else {
      return activeStatus; // La tarjeta está vigente
    }
  }


  //@Cron('0 * * * *') // Ejecuta a minuto 0 de cada hora
  @Cron('0 0 1 * *') // Ejecuta a medianoche el primer día de cada mes
  async updateCardStatuses(): Promise<void> {
    const creditCards = await this.creditCardRepository.find();
    let totalProcessed = 0;
    let statusUpdated = 0;
    let expiredCards = 0;
    let aboutToExpireCards = 0;
    let activeCards = 0;
    let errors = 0;

    for (const card of creditCards) {
      totalProcessed++;
      
      try {
        const expirationDate = new Date(card.expirationDate);
        const newStatus = await this.determineCardStatus(expirationDate);
        
        if (newStatus && card.card_status_id !== newStatus.id) {
          await this.creditCardRepository.update(card.id, {
            card_status_id: newStatus.id,
          });
          statusUpdated++;
          
          // Contar por tipo de estado
          if (newStatus.id === 3) expiredCards++;
          else if (newStatus.id === 2) aboutToExpireCards++;
          else if (newStatus.id === 1) activeCards++;
        }
      } catch (error) {
        console.error(`Error actualizando tarjeta con ID ${card.id}:`, error);
        errors++;
      }
    }
    
    // Log consolidado solo si hay cambios importantes
    if (statusUpdated > 0 || errors > 0) {
      console.log(`✅ Estados de tarjetas actualizados: ${totalProcessed} procesadas, ${statusUpdated} actualizadas (${expiredCards} caducadas, ${aboutToExpireCards} por caducar, ${activeCards} vigentes)${errors > 0 ? `, ${errors} errores` : ''}`);
    } else if (totalProcessed > 0) {
      console.log(`✅ Verificación de tarjetas completada: ${totalProcessed} tarjetas verificadas, sin cambios necesarios`);
    }
  }

  // este metodo puede ser llamado manualmente desde un controlador o consola
  //para probar la actualización sin esperar al
  async testUpdateCardStatuses(): Promise<void> {
    await this.updateCardStatuses();
  }

  // Método que se ejecutará cuando el módulo sea inicializado
  async onModuleInit(): Promise<void> {
    console.log('Módulo inicializado, actualizando estados de tarjetas...');
    await this.updateCardStatuses();
    console.log('✅ Estados de tarjetas inicializados correctamente');
  }
}
