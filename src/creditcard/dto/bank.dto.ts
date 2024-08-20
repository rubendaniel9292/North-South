import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class BankDTO {
  @IsNotEmpty()
  @IsString()
  bankName: string;
}

export class UpdateBankDTO {
  @IsOptional()
  @IsString()
  bankName: string;
}
