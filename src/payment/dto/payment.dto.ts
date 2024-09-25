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
  @IsString()
  number_payment: string;

  @IsNotEmpty()
  @IsNumber()
  value: number;

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
