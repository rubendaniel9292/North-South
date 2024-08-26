import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class PaymentMethod {
  @IsNotEmpty()
  @IsString()
  methodName: string;
}

export class UpdatePaymentMethod {
  @IsOptional()
  @IsString()
  methodName: string;
}
