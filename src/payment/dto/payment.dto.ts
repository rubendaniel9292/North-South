import { IPayment } from '@/interface/all.Interfaces';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsDate,
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

  @IsNotEmpty()
  @IsNumber()
  pending_value: number;

  @IsNotEmpty()
  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}
export class CreateAdvancePaymentDTO {
  @IsNotEmpty()
  @IsInt()
  policy_id: number;

  @IsNotEmpty()
  @IsInt()
  number_payment: number;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsNumber()
  pending_value: number;

  @IsNotEmpty()
  @IsString()
  credit: string; // Frontend envía como string "0.00"

  @IsNotEmpty()
  @IsNumber()
  balance: number;

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsNotEmpty()
  @IsInt()
  status_payment_id: number;

  @IsNotEmpty()
  @IsInt()
  year: number;

  @IsString()
  @IsNotEmpty()
  observations: string;

  @IsNotEmpty()
  createdAt: string | Date; // ✅ Fecha tentativa de cobro (ISO string del frontend)
}