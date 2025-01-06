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
    console.log('Fecha de expiración:', expirationDate);
    console.log('Inicio del mes actual:', currentMonthStart);
    console.log('Inicio del próximo mes:', nextMonthStart);

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

    console.log('Estados obtenidos:', {
      expiredStatus,
      aboutToExpireStatus,
      activeStatus,
    });

    /*El método getTime() devuelve 
    la representación de la fecha en milisegundos desde el 1 de enero de 1970
    Se asegura de que ambos valores sean precisos hasta el nivel de milisegundos, eliminando cualquier ambigüedad.*/
    if (expirationDate.getTime() < currentDate.getTime()) {
      return expiredStatus; // La tarjeta ha caducado
    } else if (
      expirationDate.getTime() >= currentDate.getTime() &&
      expirationDate.getTime() < nextMonthStart.getTime()
    ) {
      return aboutToExpireStatus; // La tarjeta está por caducar
    } else {
      return activeStatus; // La tarjeta está vigente
    }
  }


  //@Cron('0 * * * *') // Ejecuta a minuto 0 de cada hora
  @Cron('0 0 1 * *') // Ejecuta a medianoche el primer día de cada mes
  async updateCardStatuses(): Promise<void> {
    console.log('Actualizando estados de las tarjetas...');
    const creditCards = await this.creditCardRepository.find();

    for (const card of creditCards) {
      const expirationDate = new Date(card.expirationDate);
      const newStatus = await this.determineCardStatus(expirationDate);
      if (newStatus && card.card_status_id !== newStatus.id) {
        console.log(
          `Actualizando tarjeta con ID ${card.id} del estado ${card.card_status_id} al estado ${newStatus.id}`,
        );
        try {
          await this.creditCardRepository.update(card.id, {
            card_status_id: newStatus.id,
          });
          console.log(`Tarjeta ID ${card.id} actualizada exitosamente.`);
        } catch (error) {
          console.error(`Error actualizando tarjeta con ID ${card.id}:`, error);
        }
      } else {
        console.log(`Tarjeta ID ${card.id} ya está en el estado correcto.`);
      }
    }
    console.log('Actualización de estados de las tarjetas completada.');
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
  }
}
