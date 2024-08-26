import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class Payment {
  @IsNotEmpty()
  @IsString()
  observations: string;
}

export class UpdatePayment {
  @IsOptional()
  @IsString()
  observations: string;
}
