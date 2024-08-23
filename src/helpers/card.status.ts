import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CreditCardEntity } from '@/creditcard/entities/credit.card.entity';
import { CardStatusEntity } from '@/creditcard/entities/card.status.entity';

@Injectable()
export class CreditCardStatusService {
  constructor(
    @InjectRepository(CreditCardEntity)
    private readonly creditCardRepository: Repository<CreditCardEntity>,
    @InjectRepository(CardStatusEntity)
    private readonly cardStatusRepository: Repository<CardStatusEntity>,
  ) {}

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

    console.log('Estados obtenidos:', {
      expiredStatus,
      aboutToExpireStatus,
      activeStatus,
    });

    if (expirationDate < currentMonthStart) {
      return expiredStatus; // La tarjeta ha caducado
    } else if (
      expirationDate >= currentMonthStart &&
      expirationDate < nextMonthStart
    ) {
      return aboutToExpireStatus; // La tarjeta está por caducar
    } else {
      return activeStatus; // La tarjeta está vigente
    }
  }

  @Cron('0 0 1 * *') // Ejecuta a medianoche el primer día de cada mes
  //@Cron('0 * * * *') // Ejecuta a minuto 0 de cada hora
  async updateCardStatuses(): Promise<void> {
    console.log('Actualizando estados de las tarjetas...');
    const creditCards = await this.creditCardRepository.find();
    //const newStatus = await this.determineCardStatus(expirationDate);

    for (const card of creditCards) {
      const expirationDate = new Date(card.expirationDate);
      const newStatus = await this.determineCardStatus(
        new Date(card.expirationDate),
      );
      console.log(
        `Tarjeta ID ${card.id}: Expiración ${expirationDate.toISOString()}, Estado actual ${card.card_status_id}, Nuevo estado ${newStatus.id}`,
      );
      if (card.card_status_id !== newStatus.id) {
        console.log(
          `Actualizando tarjeta con ID ${card.id} al estado ${newStatus.id}`,
        );
        await this.creditCardRepository.update(card.id, {
          card_status_id: newStatus.id,
        });
      }
    }
  }
  // este metodo puede ser llamado manualmente desde un controlador o consola
  //para probar la actualización sin esperar al cron.
  async testUpdateCardStatuses(): Promise<void> {
    await this.updateCardStatuses();
  }
}
