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
      ]);

      // Crear nuevo cipher para code (se necesita nuevo cipher para cada operación de cifrado)
      const cipherCode = crypto.createCipheriv(this.algorithm, this.key, iv);

      const encryptedCode = Buffer.concat([
        cipherCode.update(code, 'utf8'),
        cipherCode.final(),
      ]);
      return {
        cardNumber: iv.toString('hex') + ':' + encryptedCardNumber,
        code: iv.toString('hex') + ':' + encryptedCode,
      };
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  /*desencriptado verision anterior
  protected decryptData = (encryptedData: {
    cardNumber: string;
    code: string;
  }): { cardNumber: string; code: string } => {
    try {
      console.log(encryptedData);
      // Descomponer los datos cifrados
      const [ivHexCardNumber, encryptedCardNumberHex] =
        encryptedData.cardNumber.split(':');
      const [ivHexCode, encryptedCodeHex] = encryptedData.code.split(':');
      // Imprimir para depuración
      console.log(
        'IV y datos cifrados (cardNumber):',
        ivHexCardNumber,
        encryptedCardNumberHex,
      );
      console.log('IV y datos cifrados (code):', ivHexCode, encryptedCodeHex);
      const testHex = 'd81f0245810b411b80ed6ed882def62e';
      const testBuffer = Buffer.from(testHex, 'hex');
      console.log('Test Buffer:', testBuffer);
      // Convertir IV y datos cifrados de hexadecimal a bytes
      const ivCardNumber = Buffer.from(ivHexCardNumber, 'hex');
      console.log(ivCardNumber);
      const encryptedCardNumber = Buffer.from(encryptedCardNumberHex, 'hex');
      console.log(encryptedCardNumber);
      const ivCode = Buffer.from(ivHexCode, 'hex');
      console.log(encryptedCardNumber);
      const encryptedCode = Buffer.from(encryptedCodeHex, 'hex');
      console.log(encryptedCardNumber);

      // Verificar que los IV coinciden
      if (!ivCardNumber.equals(ivCode)) {
        throw new Error('IV mismatch between cardNumber and code');
      }

      // Descifrar el número de tarjeta
      const decipherCardNumber = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        ivCardNumber,
      );
      console.log(decipherCardNumber);
      const decryptedCardNumber = Buffer.concat([
        decipherCardNumber.update(encryptedCardNumber),
        decipherCardNumber.final(),
      ]).toString('utf8');
      console.log(decipherCardNumber);

      // Descifrar el código
      const decipherCode = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        ivCode,
      );
      const decryptedCode = Buffer.concat([
        decipherCode.update(encryptedCode),
        decipherCode.final(),
      ]).toString('utf8');

      return { cardNumber: decryptedCardNumber, code: decryptedCode };
    } catch (error) {
      throw ErrorManager.createSignatureError(error.message);
    }
  };
  */
  protected decryptData = (encryptedData: {
    cardNumber: string;
    code: string;
  }): { cardNumber: string; code: string } => {
    try {
      const decryptField = (field: string) => {
        const [ivHex, encryptedHex] = field.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedData = Buffer.from(encryptedHex, 'hex');
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
