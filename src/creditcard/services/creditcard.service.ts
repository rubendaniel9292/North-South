import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CardOptionsEntity } from '../entities/cardoptions.entity';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { BankDTO } from '../dto/bank.dto';
import { CardOptionDTO } from '../dto/cardptions.dto';
import { BankEntity } from '../entities/bank.entity';
import { CreditCardEntity } from '../entities/credit.card.entity';
import { CreditCardDTO } from '../dto/creditcard.dto';

@Injectable()
export class CreditcardService {
  constructor(
    @InjectRepository(CardOptionsEntity)
    private readonly cardopstionsRepository: Repository<CardOptionsEntity>,

    @InjectRepository(BankEntity)
    private readonly bankRepository: Repository<BankEntity>,

    @InjectRepository(CreditCardEntity)
    private readonly cardRepository: Repository<CreditCardEntity>,
  ) {}
  //SERVICIO RELACIONADO CON TODO LO QUE TIENE VER CON LAS TARJETAS DE CREDITO O DEBITO
  //1:metodo para registrar un tipo de tarjeta. por defecto se agregan varios en el scritp de la base de datos.
  //se invocara este metodo desde el frontend en caso de que sea necesario añadir otro tipo, no funciona desde postman
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
      const newBank = await this.bankRepository.save(body);
      console.log('datos guardados en la bd: ', newBank);
      return newBank;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3:metodo para registrar una tarjeta de credito o debito
  //se invocara este metodo desde el frontend en caso de que sea necesario añadir otro banco, funciona correctamente desde postman
  public createCrard = async (
    body: CreditCardDTO,
  ): Promise<CreditCardEntity> => {
    try {
      console.log('datos recibidos en el servicio: ', body);
      const newCard = await this.cardRepository.save(body);
      console.log('datos guardados en la bd: ', newCard);
      return newCard;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
