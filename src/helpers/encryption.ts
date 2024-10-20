import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
//import { encrypt } from '@/helpers/encryption';
import { Repository } from 'typeorm';
import { ErrorManager } from './error.manager';
import { CreditCardEntity } from '@/creditcard/entities/credit.card.entity';
//import { CreditCardDTO } from '@/creditcard/dto/creditcard.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptDataCard {
  private readonly key: Buffer;
  private readonly algorithm = 'aes-256-cbc';
  constructor(
    @InjectRepository(CreditCardEntity)
    protected readonly encryptRepository: Repository<CreditCardEntity>,
    protected readonly configService: ConfigService,
  ) {
    const password = this.configService.get<string>('PWD_CARD');
    this.key = crypto.scryptSync(password, 'salt', 32);
  }
  protected encryptData = (cardNumber: string, code: string) => {
    // Eliminar posibles espacios en blanco
    cardNumber = cardNumber.trim();
    code = code.trim();
    try {
      const iv = crypto.randomBytes(16); // Vector de inicialización
      const cipherNumber = crypto.createCipheriv(this.algorithm, this.key, iv);
      const encryptedCardNumber = Buffer.concat([
        cipherNumber.update(cardNumber, 'utf8'),
        cipherNumber.final(),
      ]).toString('hex');

      // Crear nuevo cipher para code (se necesita nuevo cipher para cada operación de cifrado)
      const cipherCode = crypto.createCipheriv(this.algorithm, this.key, iv);

      const encryptedCode = Buffer.concat([
        cipherCode.update(code, 'utf8'),
        cipherCode.final(),
      ]).toString('hex');
      // Devuelve el IV concatenado con los datos cifrados en el formato `iv:encryptedData`
      return {
        cardNumber: `${iv.toString('hex')}:${encryptedCardNumber}`,
        code: `${iv.toString('hex')}:${encryptedCode}`,
      };
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };

  protected decryptData = (encryptedData: {
    cardNumber: string;
    code: string;
  }): { cardNumber: string; code: string } => {
    try {
      const decryptField = (field: string) => {
        // Separar el IV y los datos cifrados
        const [ivHex, encryptedHex] = field.split(':');
        if (!ivHex || !encryptedHex) {
          throw new Error('Formato de datos cifrados incorrecto');
        }

        // Convertir el IV y los datos cifrados de hexadecimal a buffer
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedData = Buffer.from(encryptedHex, 'hex');

        // Crear el desencriptador
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        return Buffer.concat([
          decipher.update(encryptedData),
          decipher.final(),
        ]).toString('utf8');
      };

      return {
        cardNumber: decryptField(encryptedData.cardNumber),
        code: decryptField(encryptedData.code),
      };
    } catch (error) {
      console.error('Error en desencriptación:', error);
      throw ErrorManager.createSignatureError(error.message);
    }
  };
}
