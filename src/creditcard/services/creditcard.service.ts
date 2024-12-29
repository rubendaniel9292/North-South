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
      console.log('datos recibidos en el servicio: ', body);
      const newCardType = await this.cardopstionsRepository.save(body);
      console.log('datos guardados en la bd: ', newCardType);
      return newCardType;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //2:metodo para registrar un banco o cooperativa emira de de tarjeta. por defecto se agregan varios en el scritp de la base de datos.
  //se invocara este metodo desde el frontend en caso de que sea necesario añadir otro banco, funciona correctamente desde postman
  public createBank = async (body: BankDTO): Promise<BankEntity> => {
    try {
      console.log('datos recibidos en el servicio: ', body);
      //llamar al metodo de encriptacion de los datos
      //const newCard = await this.encryptDataCard.createCard(cardDTO);
      const newBank = await this.bankRepository.save(body);
      console.log('datos guardados en la bd: ', newBank);
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
      console.log('Datos recibidos en el servicio antes del cifrado:', body);
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
      const expirationDate = new Date(body.expirationDate);
      // Verificar si la tarjeta ya está caducada
      const currentDate = new Date();
      if (expirationDate < currentDate) {
        throw new Error('La tarjeta ya está caducada.');
      }

      //3 Reutilizar el método determineCardStatus para obtener el estado correcto
      const determinedStatus =
        await this.creditCardStatusService.determineCardStatus(expirationDate);

      //4 Asignar el estado determinado al body de la tarjeta
      body.card_status_id = determinedStatus.id;

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
      return allCards.map((card) => {
        // Pasar ambos valores a la función decryptData
        const { cardNumber, code } = this.decryptData({
          cardNumber: card.cardNumber,
          code: card.code,
        });
        return {
          ...card,
          cardNumber: cardNumber,
          code: code,
        };
      });
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
  public findCrardsExpired = async (): Promise<CreditCardEntity[]> => {
    try {
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
      return allCardsExpired.map((card) => {
        // Pasar ambos valores a la función decryptData
        const { cardNumber, code } = this.decryptData({
          cardNumber: card.cardNumber,
          code: card.code,
        });
        return {
          ...card,
          cardNumber: cardNumber,
          code: code,
        };
      });
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //6:metodo para consultar los bancos
  public findBanks = async (): Promise<BankEntity[]> => {
    try {
      //this.decryptData()
      const allBanks: BankEntity[] = await this.bankRepository.find();

      if (allBanks.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      return allBanks;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //7:metodo para consultar los tipos de tarjeta
  public findCrardsOptions = async (): Promise<CardOptionsEntity[]> => {
    try {
      const allOptions: CardOptionsEntity[] =
        await this.cardopstionsRepository.find();

      if (allOptions.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      return allOptions;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
