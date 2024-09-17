import { BankAccountService } from './../services/bankaccount.service';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/decorators';

import { BankAccountDTO } from '../dto/bankaccount.dto';

@Controller('bankaccount')
@UseGuards(AuthGuard, RolesGuard)
export class BankaccountController {
  constructor(private readonly banckAccountService: BankAccountService) {}
  @Roles('ADMIN', 'BASIC')
  @Post('register-account')
  public async registerBankAccount(@Body() body: BankAccountDTO) {
    const newBankAccount =
      await this.banckAccountService.createBankAccount(body);

    if (newBankAccount) {
      return {
        status: 'success',
        newBankAccount: newBankAccount,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('get-all-account')
  public async allBankAccount() {
    const allBankAccounts = await this.banckAccountService.findAllBankAccount();
    if (allBankAccounts) {
      return {
        status: 'success',
        allBankAccounts,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('all-banks')
  public async findBanks() {
    const allBanks = await this.banckAccountService.findBanks();
    if (allBanks) {
      return {
        status: 'success',
        allBanks,
      };
    }
  }

  @Roles('ADMIN', 'BASIC')
  @Get('all-type-accounts')
  public async findAccounts() {
    const allTypeAccounts = await this.banckAccountService.findTypeAccounts();
    if (allTypeAccounts) {
      return {
        status: 'success',
        allTypeAccounts,
      };
    }
  }
}
