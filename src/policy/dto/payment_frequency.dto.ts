import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PaymentFrequency {
  @IsNotEmpty()
  @IsString()
  frequencyName: string;
}

export class UpdatePaymentFrequency {
  @IsOptional()
  @IsString()
  frequencyName: string;
}
