import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
export class CreditCardDTO {
  @IsNotEmpty()
  @IsInt()
  customers_id: number;

  @IsNotEmpty()
  @IsString()
  cardNumber: string;

  @IsNotEmpty()
  @IsDate()
  expirationDate: Date;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsInt()
  card_option_id: number;

  @IsNotEmpty()
  @IsInt()
  bank_id: number;

  @IsOptional()
  @IsInt()
  card_status_id?: number;
}

export class UpdateCreditCardDTO {
  @IsOptional()
  @IsInt()
  customer_id: number;

  @IsOptional()
  @IsString()
  cardNumber: string;

  @IsOptional()
  @IsDate()
  expirationDate: Date;

  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsInt()
  card_option_id: number;

  @IsOptional()
  @IsInt()
  bank_id: number;

  @IsOptional()
  @IsInt()
  card_status_id?: number;
}
