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
  constructor(private readonly creditCarService: CreditcardService) {}
  @Roles('ADMIN', 'BASIC')
  @Post('register-type')
  public async registerTypeCard(@Body() body: CardOptionDTO) {
    console.log('datos recibidos en el cotnrolador: ', body);
    const newCardType = await this.creditCarService.createCreditdCarType(body);
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
    const newBank = await this.creditCarService.createBank(body);
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
    console.log('datos recibidos en el cotnrolador: ', body); // Verifica qué estás recibiendo
    const newCard = await this.creditCarService.createCrard(body);
    console.log('Datos enviado al servicio: ', newCard); // Verifica qué estás recibiendo

    if (newCard) {
      return {
        status: 'success',
        newCard,
      };
    }
  }

  @Roles('ADMIN', 'BASIC') //Solo usuarios admin podran ver todos los usuarios
  @Get('all-cards')
  public async findAllCards() {
    const allCards = await this.creditCarService.findAllCrards();
    if (allCards) {
      return {
        status: 'success',
        allCards,
      };
    }
  }
  // endpoint de actualización de estados de tarjeta manualmente.
}
