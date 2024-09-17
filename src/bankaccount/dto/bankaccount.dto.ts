import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
// cardName: string;

export class BankAccountDTO {
  @IsNotEmpty()
  @IsInt()
  customers_id: number;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsInt()
  bank_id: number;

  @IsNotEmpty()
  @IsInt()
  account_type_id: number;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateBankAccountDTO {
  @IsOptional()
  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  observations?: string;
}

export class BankAccountTypeDTO {
  @IsNotEmpty()
  @IsString()
  typeName: string;
}

export class UpdateBankAccountTypeDTO {
  @IsOptional()
  @IsString()
  typeName?: string;
}
