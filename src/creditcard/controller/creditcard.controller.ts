import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BankDTO } from '../dto/bank.dto';
import { CardOptionDTO } from '../dto/cardptions.dto';
import { CreditcardService } from '../services/creditcard.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';
import { CreditCardDTO } from '../dto/creditcard.dto';
@Controller('creditcard')
@UseGuards(AuthGuard, RolesGuard)
export class CreditcardController {
  constructor(private readonly creditCardService: CreditcardService) {}
  @Roles('ADMIN', 'BASIC')
  @Post('register-type')
  public async registerTypeCard(@Body() body: CardOptionDTO) {
    console.log('datos recibidos en el cotnrolador: ', body);
    const newCardType = await this.creditCardService.createCreditdCarType(body);
    console.log('Datos enviado al servicio: ', newCardType);

    if (newCardType) {
      return {
        status: 'success',
        newCardType,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Post('register-bank')
  public async registerBank(@Body() body: BankDTO) {
    console.log('datos recibidos en el cotnrolador: ', body); // Verifica qué estás recibiendo
    const newBank = await this.creditCardService.createBank(body);
    console.log('Datos enviado al servicio: ', newBank); // Verifica qué estás recibiendo

    if (newBank) {
      return {
        status: 'success',
        newBank,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Post('register-card')
  public async registerCard(@Body() body: CreditCardDTO) {
    const newCard = await this.creditCardService.createCrard(body);

    if (newCard) {
      return {
        status: 'success',
        newCard,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('all-cards')
  public async findAllCards() {
    const allCards = await this.creditCardService.findAllCrards();
    if (allCards) {
      return {
        status: 'success',
        allCards,
      };
    }
  }

  @Roles('ADMIN', 'BASIC') //Solo usuarios admin podran ver todos los usuarios
  @Get('all-types')
  public async findTypes() {
    const allTypes = await this.creditCardService.findCrardsOptions();
    if (allTypes) {
      return {
        status: 'success',
        allTypes,
      };
    }
  }
  @Roles('ADMIN', 'BASIC')
  @Get('all-banks')
  public async findBanks() {
    const allBanks = await this.creditCardService.findBanks();
    if (allBanks) {
      return {
        status: 'success',
        allBanks,
      };
    }
  }
}
