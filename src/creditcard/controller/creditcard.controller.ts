import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { BankDTO } from '../dto/bank.dto';
import { CardOptionDTO } from '../dto/cardptions.dto';
import { CreditcardService } from '../services/creditcard.service';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';
import { CreditCardDTO, UpdateCreditCardDTO } from '../dto/creditcard.dto';
@Controller('creditcard')
@UseGuards(AuthGuard, RolesGuard)
export class CreditcardController {
  constructor(private readonly creditCardService: CreditcardService) { }
  @Roles('ADMIN', 'BASIC')
  @Post('register-type')
  public async registerTypeCard(@Body() body: CardOptionDTO) {
    const newCardType = await this.creditCardService.createCreditdCarType(body);

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
    const newBank = await this.creditCardService.createBank(body);

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
    const newCard = await this.creditCardService.createCard(body);

    if (newCard) {
      return {
        status: 'success',
        newCard,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Put('update-card/:id')
  public async updateCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCreditCardDTO
  ) {
    const updatedCard = await this.creditCardService.updateCard(id, body);

    if (updatedCard) {
      return {
        status: 'success',
        message: 'Tarjeta actualizada correctamente',
        updatedCard,
      };
    }
  }

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('all-cards')
  public async findAllCards(@Query('turnstileToken') turnstileToken: string) {
    if (!turnstileToken) {
      throw new BadRequestException('Token de Turnstile requerido');
    }
    const allCards = await this.creditCardService.findAllCrards();
    if (allCards) {
      return {
        status: 'success',
        allCards,
      };
    }
  }
  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('all-cards-rp')
  public async findAllCardsRegpolicy() {
    const allCards = await this.creditCardService.findAllCrards();
    if (allCards) {
      return {
        status: 'success',
        allCards,
      };
    }
  }

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
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
  @Roles('ADMIN', 'BASIC', 'ELOPDP')
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

  @Roles('ADMIN', 'BASIC', 'ELOPDP')
  @Get('all-cards-expireds')
  public async findCardExpired() {
    const allCardsExpired = await this.creditCardService.findCardsExpired();
    if (allCardsExpired) {
      return {
        status: 'success',
        allCardsExpired,
      };
    }
  }
}
