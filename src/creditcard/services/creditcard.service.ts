import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardOptionsEntity } from '../entities/cardoptions.entity';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { BankDTO } from '../dto/bank.dto';
import { CardOptionDTO } from '../dto/cardptions.dto';
import { BankEntity } from '../../config/bank.entity';
import { CreditCardEntity } from '../entities/credit.card.entity';
import { CreditCardDTO } from '../dto/creditcard.dto';
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
      await this.redisService.del('allCards');
      await this.redisService.del('allCardsExpired');
      return newCard;
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
      console.log('Datos recibidos en el servicio:', body);
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
  public findAllCrards = async (): Promise<CreditCardEntity[]> => {
    try {
      // Verificar si los datos están en Redis
      const cachedCards = await this.redisService.get('allCards');
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
      await this.redisService.set('allCards', JSON.stringify(decryptedCards), 32400); // TTL de 1 hora
      return decryptedCards;

    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //4:metodo para consultar las tarjetas sin cifrado
  /*
  public findAllCrards = async (): Promise<CreditCardEntity[]> => {
    try {
      //this.decryptData()
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

      return allCards;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };*/

  //5:metodo para consultar las tarjetas expiradas o caducadas
  public findCardsExpired = async (): Promise<CreditCardEntity[]> => {
    try {
      // Verificar si los datos están en Redis
      const cachedCards = await this.redisService.get('allCardsExpired');
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
      await this.redisService.set('allCardsExpired', JSON.stringify(decryptedCards), 32400); // TTL de 9 horas

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
        console.log('Datos desde Redis:', cachedBanks);
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
}
