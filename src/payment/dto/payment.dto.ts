import { IPayment } from '@/interface/all.Interfaces';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsInt,
} from 'class-validator';

export class PaymentDTO implements IPayment {
  @IsNotEmpty()
  @IsInt()
  policy_id: number; // Este es el ID de la póliza con la que está relacionada

  @IsNotEmpty()
  @IsInt()
  number_payment: number;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsInt()
  status_payment_id: number;

  @IsNumber()
  @IsOptional()
  credit?: number;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsString()
  @IsOptional()
  observations?: string;
}
