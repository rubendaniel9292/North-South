import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorManager } from '@/helpers/error.manager';
import { BankEntity } from '../../config/bank.entity';
import { BankAccountEntity } from '../entities/bank-account.entity';
import { BankAccountDTO } from '../dto/bankaccount.dto';
import { AccountTypeEntity } from '../entities/account-type.entity';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankEntity)
    private readonly bankRepository: Repository<BankEntity>,

    @InjectRepository(BankAccountEntity)
    private readonly bankAccountRepository: Repository<BankAccountEntity>,

    @InjectRepository(AccountTypeEntity)
    private readonly bankAccountTypeRepository: Repository<AccountTypeEntity>,
  ) {}
  //SERVICIO RELACIONADO CON TODO LO QUE TIENE VER CON LAS CUENTAS BANCARIAS
  //1:metodo para registrar una cuenta bancaria
  public createBankAccount = async (
    body: BankAccountDTO,
  ): Promise<BankAccountEntity> => {
    try {
      // Verificar si ya existe una cuenta registrada
      const accountNumber = await this.bankAccountRepository.findOne({
        where: {
          accountNumber: body.accountNumber,
        },
      });
      if (accountNumber) {
        throw new Error('El esta cuenta ya esta registrada.');
      }

      // Guardar los datos de la tarjeta con el estado asignado
      const newBankAccount = await this.bankAccountRepository.save(body);
      return newBankAccount;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  //2:metodo para consutlar todas las cuentas bancarias
  public findAllBankAccount = async (): Promise<BankAccountEntity[]> => {
    try {
      const allBankAccounts: BankAccountEntity[] =
        await this.bankAccountRepository.find({
          relations: ['customer', 'bank', 'accountType'],
          select: {
            id: true,
            accountNumber: true,
            customer: {
              ci_ruc: true,
              firstName: true,
              secondName: true,
              surname: true,
              secondSurname: true,
            },
          },
        });
      if (allBankAccounts.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }
      return allBankAccounts;
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  //3:metodo para consultar los bancos
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
  //4:metodo para consultar los bancos
  public findTypeAccounts = async (): Promise<AccountTypeEntity[]> => {
    try {
      //this.decryptData()
      const allTypeAccounts: AccountTypeEntity[] =
        await this.bankAccountTypeRepository.find();

      if (allTypeAccounts.length === 0) {
        //se guarda el error
        throw new ErrorManager({
          type: 'BAD_REQUEST',
          message: 'No se encontró resultados',
        });
      }

      return allTypeAccounts;
    } catch (error) {
      //se ejecuta el errir
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
