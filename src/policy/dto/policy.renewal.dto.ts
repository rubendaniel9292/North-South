import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDate,
  IsNumber,
} from 'class-validator';

export class PolicyRenewalDTO {
  @IsNotEmpty()
  @IsInt()
  policy_id: number;

  @IsNotEmpty()
  @IsInt()
  renewalNumber: number;

  @IsNotEmpty()
  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsNumber()
  policyValue?: number;

  @IsOptional()
  @IsNumber()
  agencyPercentage?: number;

  @IsOptional()
  @IsNumber()
  advisorPercentage?: number;

  @IsOptional()
  @IsNumber()
  coverageAmount?: number;

  @IsOptional()
  @IsNumber()
  paymentsToAgency?: number;

  @IsOptional()
  @IsNumber()
  paymentsToAdvisor?: number

  @IsOptional()
  @IsNumber()
  policyFee?: number;

  @IsOptional()
  @IsInt()
  payment_frequency_id?: number;
  @IsOptional()
  @IsInt()
  numberOfPayments?: number;
}
