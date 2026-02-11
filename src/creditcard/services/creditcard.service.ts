import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardOptionsEntity } from '../entities/cardoptions.entity';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { BankDTO } from '../dto/bank.dto';
import { CardOptionDTO } from '../dto/cardptions.dto';
import { BankEntity } from '../../config/bank.entity';
import { CreditCardEntity } from '../entities/credit.card.entity';
import { CreditCardDTO, UpdateCreditCardDTO } from '../dto/creditcard.dto';
import { EncryptDataCard } from '@/helpers/encryption';
import { ConfigService } from '@nestjs/config';
import { CreditCardStatusService } from '@/helpers/card.status';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';
import { CacheKeys } from '@/constants/cache.enum';
import { DateHelper } from '@/helpers/date.helper';

@Injectable()
export class CreditcardService extends EncryptDataCard {
  constructor(
    @InjectRepository(CardOptionsEntity)
    private readonly cardopstionsRepository: Repository<CardOptionsEntity>,

    @InjectRepository(BankEntity)
    private readonly bankRepository: Repository<BankEntity>,

    @InjectRepository(CreditCardEntity)
    private readonly cardRepository: Repository<CreditCardEntity>,
    private readonly creditCardStatusService: CreditCardStatusService, // Inyectar el servicio existente
    protected readonly configService: ConfigService,
    private readonly redisService: RedisModuleService
  ) {
    // Pasar el repositorio al constructor de la clase base
    super(cardRepository, configService);
  }
  //SERVICIO RELACIONADO CON TODO LO QUE TIENE VER CON LAS TARJETAS DE CREDITO O DEBITO
  //1:metodo para registrar un tipo de tarjeta por defecto se agregan varios en el scritp de la base de datos.
  public createCreditdCarType = async (
    body: CardOptionDTO,
  ): Promise<CardOptionsEntity> => {
    try {

      const newCardType = await this.cardopstionsRepository.save(body);
      // Guardar en Redis (sin TTL, ya que es un dato estático o poco cambiante)
      await this.redisService.set(`cardType:${newCardType.id}`, JSON.stringify(newCardType));

      // Invalidar la lista de tipos de tarjetas cacheada (si existe)
      await this.redisService.del(CacheKeys.GLOBAL_CARD_OPTIONS);

      return newCardType;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2:metodo para registrar un banco o cooperativa emira de de tarjeta. por defecto se agregan varios en el scritp de la base de datos.
  //se invocara este metodo desde el frontend en caso de que sea necesario añadir otro banco, funciona correctamente desde postman
  public createBank = async (body: BankDTO): Promise<BankEntity> => {
    try {

      const newBank = await this.bankRepository.save(body);
      // Guardar en Redis (sin TTL, ya que es un dato estático o poco cambiante)
      await this.redisService.set(`bank:${newBank.id}`, JSON.stringify(newBank));

      // Invalidar la lista de bancos cacheada (si existe)
      await this.redisService.del(CacheKeys.GLOBAL_BANKS);

      return newBank;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3:metodo para registrar y encriptar tarjeta de credito o debito. quedara pendiente por problemas con el desencriptado
  public createCard = async (
    body: CreditCardDTO,
  ): Promise<CreditCardEntity> => {
    try {

      //1 Verificar si ya existe una tarjeta con el mismo número asociada al cliente
      const existingCard = await this.cardRepository.findOne({
        where: {
          cardNumber: body.cardNumber,
          customers_id: body.customers_id,
        },
      });

      if (existingCard) {
        throw new Error('El cliente ya tiene una tarjeta con este número.');
      }
      //2 Convertir la fecha de expiración a Date si es una cadena
      const expirationDate = DateHelper.normalizeDateForDB(body.expirationDate);

      // Verificar si la tarjeta ya está caducada
      const currentDate = new Date();
      if (expirationDate <= currentDate) {
        throw new Error('La tarjeta ya está caducada.');
      }

      //3 Reutilizar el método determineCardStatus para obtener el estado correcto
      const determinedStatus =
        await this.creditCardStatusService.determineCardStatus(expirationDate);

      //4 Asignar el estado determinado al body de la tarjeta
      body.card_status_id = determinedStatus.id;
      body.expirationDate = expirationDate;

      //5 Encriptar solo el número de tarjeta y el código
      const encryptedData = this.encryptData(body.cardNumber, body.code);

      //6 Actualizar el objeto body con los datos cifrados
      const encryptedBody = {
        ...body,
        cardNumber: encryptedData.cardNumber,
        code: encryptedData.code,
      };

      //7 Guardar los datos encriptados en la base de datos
      const newCard = await this.cardRepository.save(encryptedBody);
      // Guardar la tarjeta en Redis

      await this.redisService.set(`card:${newCard.id}`, JSON.stringify(newCard), 32400); // TTL de 9 horas
      // Invalidar las listas cacheadas para forzar una actualización
      await this.redisService.del(CacheKeys.GLOBAL_ALL_CARDS);
      await this.redisService.del(CacheKeys.GLOBAL_ALL_CARDS_EXPIRED);

      return newCard;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3B:metodo para actualizar una tarjeta de credito o debito
  public updateCard = async (
    id: number,
    updateData: UpdateCreditCardDTO,
  ): Promise<CreditCardEntity> => {
    try {
      // 1. Buscar la tarjeta existente
      const existingCard: CreditCardEntity = await this.cardRepository.findOne({
        where: { id },
      });

      if (!existingCard) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró la tarjeta especificada',
        });
      }

      // 2. Si se actualiza la fecha de expiración, normalizarla y verificar que no esté caducada
      if (updateData.expirationDate) {
        const expirationDate = DateHelper.normalizeDateForDB(updateData.expirationDate);
        const currentDate = new Date();

        if (expirationDate <= currentDate) {
          throw new Error('La nueva fecha de expiración ya está caducada.');
        }

        // Determinar el nuevo estado basado en la fecha de expiración
        const determinedStatus = await this.creditCardStatusService.determineCardStatus(expirationDate);
        updateData.card_status_id = determinedStatus.id;
        updateData.expirationDate = expirationDate;
      }

      // 3. Si se actualiza el número de tarjeta, verificar que no exista otra tarjeta con el mismo número para el cliente
      if (updateData.numberCard && updateData.customer_id) {
        const duplicateCard = await this.cardRepository.findOne({
          where: {
            cardNumber: updateData.numberCard,
            customers_id: updateData.customer_id,
          },
        });

        // Si encontramos una tarjeta y no es la que estamos actualizando, es un duplicado
        if (duplicateCard && duplicateCard.id !== id) {
          throw new Error('Ya existe otra tarjeta con este número para el cliente.');
        }
      }

      // 4. Preparar los datos para encriptar si es necesario
      let encryptedData: any = {};
      if (updateData.numberCard || updateData.code) {
        // Si se actualiza el número o código, encriptar los datos
        let cardNumberToEncrypt = updateData.numberCard || existingCard.cardNumber;
        let codeToEncrypt = updateData.code || existingCard.code;

        // Primero desencriptar los datos actuales si no se proporcionan nuevos
        if (!updateData.numberCard) {
          const decrypted = this.decryptData({
            cardNumber: existingCard.cardNumber,
            code: existingCard.code,
          });
          cardNumberToEncrypt = decrypted.cardNumber;
        }

        if (!updateData.code) {
          const decrypted = this.decryptData({
            cardNumber: existingCard.cardNumber,
            code: existingCard.code,
          });
          codeToEncrypt = decrypted.code;
        }

        // Encriptar los datos
        encryptedData = this.encryptData(cardNumberToEncrypt, codeToEncrypt);
      }

      // 5. Preparar el objeto de actualización
      const updateObject: any = {};

      if (updateData.customer_id) updateObject.customers_id = updateData.customer_id;
      if (updateData.numberCard) updateObject.cardNumber = encryptedData.cardNumber;
      if (updateData.expirationDate) updateObject.expirationDate = updateData.expirationDate;
      if (updateData.code) updateObject.code = encryptedData.code;
      if (updateData.card_option_id) updateObject.card_option_id = updateData.card_option_id;
      if (updateData.bank_id) updateObject.bank_id = updateData.bank_id;
      if (updateData.card_status_id !== undefined) updateObject.card_status_id = updateData.card_status_id;

      // 6. Actualizar la tarjeta
      await this.cardRepository.update(id, updateObject);

      // 7. Obtener la tarjeta actualizada
      const updatedCard = await this.cardRepository.findOne({
        where: { id },
        relations: ['customer', 'cardoption', 'bank', 'cardstatus'],
      });

      // 8. Invalidar cachés relacionados
      await this.redisService.del(`card:${id}`);
      await this.redisService.del(CacheKeys.GLOBAL_ALL_CARDS);
      await this.redisService.del(CacheKeys.GLOBAL_ALL_CARDS_EXPIRED);

      // 9. Guardar la tarjeta actualizada en caché
      await this.redisService.set(`card:${id}`, JSON.stringify(updatedCard), 32400);

      return updatedCard;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3:metodo para registrar sin encriptar una tarjeta de credito o debito
  /*
  public createCard = async (
    body: CreditCardDTO,
  ): Promise<CreditCardEntity> => {
    try {
      // Convertir la fecha de expiración a Date si es una cadena
      const expirationDate = new Date(body.expirationDate);
      // Verificar si la tarjeta ya está caducada
      const currentDate = new Date();
      if (expirationDate < currentDate) {
        throw new Error('La tarjeta ya está caducada.');
      }
      // Verificar si ya existe una tarjeta con el mismo número asociada al cliente
      const existingCard = await this.cardRepository.findOne({
        where: {
          cardNumber: body.cardNumber,
          customers_id: body.customers_id, // Asegúrate de que `customer_id` esté presente en el DTO
        },
      });
      if (existingCard) {
        throw new Error('El cliente ya tiene una tarjeta con este número.');
      }
      // Reutilizar el método determineCardStatus para obtener el estado correcto
      const determinedStatus =
        await this.creditCardStatusService.determineCardStatus(expirationDate);

      // Asignar el estado determinado al body de la tarjeta
      body.card_status_id = determinedStatus.id;
      // Guardar los datos de la tarjeta con el estado asignado
      const newCard = await this.cardRepository.save(body);
      return newCard;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };*/

  //4:metodo para consultar y desencriptar las tarjetas de credito
  public findAllCards = async (): Promise<CreditCardEntity[]> => {
    try {
      // Verificar si los datos están en Redis

      const cachedCards = await this.redisService.get(CacheKeys.GLOBAL_ALL_CARDS);
      if (cachedCards) {
        return JSON.parse(cachedCards);
      }

      const allCards: CreditCardEntity[] = await this.cardRepository.find({
        relations: ['customer', 'cardoption', 'bank', 'cardstatus'],
        select: {
          id: true,
          cardNumber: true,
          expirationDate: true,
          code: true,
          customer: {
            ci_ruc: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
        },
      });

      if (allCards.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      // Desencriptar los datos de cada tarjeta y mantener las relaciones
      const decryptedCards = allCards.map((card) => {

        const { cardNumber, code } = this.decryptData({
          cardNumber: card.cardNumber,
          code: card.code,
        });
        return {
          ...card,
          cardNumber: `************${cardNumber.slice(-4)}`,
          //cardNumber
          code,
        };
      });

      // Guardar los datos desencriptados en Redis
      await this.redisService.set(CacheKeys.GLOBAL_ALL_CARDS, JSON.stringify(decryptedCards), 32400); // TTL de 9 horas
      return decryptedCards;

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //5:metodo para consultar las tarjetas expiradas o caducadas
  public findCardsExpired = async (): Promise<CreditCardEntity[]> => {
    try {
      // Verificar si los datos están en Redis

      const cachedCards = await this.redisService.get(CacheKeys.GLOBAL_ALL_CARDS_EXPIRED);
      if (cachedCards) {
        return JSON.parse(cachedCards);
      }

      const allCardsExpired: CreditCardEntity[] =
        await this.cardRepository.find({
          where: [
            { card_status_id: 2 }, // Estado: por caducar
            { card_status_id: 3 }, // Estado: caducada
          ],
          relations: ['customer', 'cardoption', 'bank', 'cardstatus'],
          select: {
            id: true,
            cardNumber: true,
            expirationDate: true,
            code: true,
            customer: {
              ci_ruc: true,
              firstName: true,
              secondName: true,
              surname: true,
              secondSurname: true,
              numberPhone: true,
            },
          },
        });

      if (allCardsExpired.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      // Desencriptar los datos de cada tarjeta y mantener las relaciones
      const decryptedCards = allCardsExpired.map((card) => {
        // Pasar ambos valores a la función decryptData
        const { cardNumber, code } = this.decryptData({
          cardNumber: card.cardNumber,
          code: card.code,
        });
        return {
          ...card,
          //cardNumber: cardNumber,
          cardNumber: `************${cardNumber.slice(-4)}`,
          code: code,
        };
      });
      // Guardar los datos desencriptados en Redis
      await this.redisService.set(CacheKeys.GLOBAL_ALL_CARDS_EXPIRED, JSON.stringify(decryptedCards), 32400); // TTL de 9 horas

      return decryptedCards;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6:metodo para consultar los bancos
  public findBanks = async (): Promise<BankEntity[]> => {
    try {
      // Verificar si los datos están en Redis
      //const cachedBanks = await this.redisService.get('allBanks');
      const cachedBanks = await this.redisService.get(CacheKeys.GLOBAL_BANKS);
      if (cachedBanks) {
        return JSON.parse(cachedBanks);

      }
      const allBanks: BankEntity[] = await this.bankRepository.find();

      if (allBanks.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      //await this.redisService.set('allBanks', JSON.stringify(allBanks), 32400); 
      await this.redisService.set(CacheKeys.GLOBAL_BANKS, JSON.stringify(allBanks));
      return allBanks;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6B:metodo para revelar datos sensibles de una tarjeta específica
  public revealCardDetails = async (id: number): Promise<{
    id: number;
    cardNumber: string;
    code: string;
    expirationDate: Date;
    customer: any;
    cardoption: any;
    bank: any;
    cardstatus: any;
  }> => {
    try {
      // Buscar la tarjeta específica con sus relaciones
      const card = await this.cardRepository.findOne({
        where: { id },
        relations: ['customer', 'cardoption', 'bank', 'cardstatus'],
        select: {
          id: true,
          cardNumber: true,
          expirationDate: true,
          code: true,
          customer: {
            ci_ruc: true,
            firstName: true,
            secondName: true,
            surname: true,
            secondSurname: true,
          },
        },
      });

      if (!card) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'Tarjeta no encontrada',
        });
      }

      // Desencriptar los datos sensibles
      const { cardNumber, code } = this.decryptData({
        cardNumber: card.cardNumber,
        code: card.code,
      });

      // Retornar datos completos sin enmascarar
      return {
        id: card.id,
        cardNumber, // Número completo
        code, // Código completo
        expirationDate: card.expirationDate,
        customer: card.customer,
        cardoption: card.cardoption,
        bank: card.bank,
        cardstatus: card.cardstatus,

      };
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //7:metodo para consultar los tipos de tarjeta
  public findCrardsOptions = async (): Promise<CardOptionsEntity[]> => {
    try {
      // Verificar si los datos están en Redis
      //const cachedOptions = await this.redisService.get('allOptions');
      const cachedOptions = await this.redisService.get(CacheKeys.GLOBAL_CARD_OPTIONS);

      //const cachedCities = await this.redisService.get(CacheKeys.GLOBAL_CITIES); // Usa el enum
      if (cachedOptions) {
        return JSON.parse(cachedOptions);
      }
      const allOptions: CardOptionsEntity[] =
        await this.cardopstionsRepository.find();

      if (allOptions.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      await this.redisService.set(CacheKeys.GLOBAL_CARD_OPTIONS, JSON.stringify(allOptions), 32400); // TTL de 1 hora
      return allOptions;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //8: metodo para eliminar una tarjeta de credito o debito
  public deleteCard = async (id: number): Promise<void> => {
    try {
      // Verificar que la tarjeta existe antes de eliminar
      const card = await this.cardRepository.findOne({
        where: { id },
      });

      if (!card) {
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró la tarjeta para eliminar',
        });
      }

      // Eliminar la tarjeta
      // Las pólizas asociadas tendrán su credit_card_id en NULL (onDelete: 'SET NULL')
      await this.cardRepository.delete(id);

      // Invalidar cachés relacionados
      await this.redisService.del(`card:${id}`);
      await this.redisService.del(CacheKeys.GLOBAL_ALL_CARDS);
      await this.redisService.del(CacheKeys.GLOBAL_ALL_CARDS_EXPIRED);
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}