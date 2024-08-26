import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDate,
} from 'class-validator';
export class PolicyDTO {
  @IsNotEmpty()
  @IsString()
  numberPolicy: string;

  @IsNotEmpty()
  @IsInt()
  coverageAmount: number;

  @IsNotEmpty()
  @IsInt()
  agencyPercentage: number;

  @IsNotEmpty()
  @IsInt()
  advisorPercentage: number;

  @IsNotEmpty()
  policyValue: number;

  @IsNotEmpty()
  @IsInt()
  numberOfPayments: number;

  @IsNotEmpty()
  @IsDate()
  startDate: Date;

  @IsNotEmpty()
  @IsDate()
  endDate: Date;

  @IsNotEmpty()
  @IsInt()
  paymentsToAdvisor: number;

  @IsNotEmpty()
  @IsString()
  observations: string;

  @IsNotEmpty()
  @IsInt()
  numberOfPaymentsAdvisor: number;
}

export class UpdatePolicyDTO {
  @IsOptional()
  @IsString()
  numberPolicy: string;

  @IsOptional()
  @IsString()
  @IsInt()
  coverageAmount: number;

  @IsOptional()
  @IsInt()
  agencyPercentage: number;

  @IsOptional()
  @IsInt()
  advisorPercentage: number;

  @IsNotEmpty()
  @IsInt()
  policyValue: number;

  @IsOptional()
  @IsInt()
  numberOfPayments: number;

  @IsOptional()
  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsDate()
  endDate: Date;

  @IsOptional()
  @IsInt()
  paymentsToAdvisor: number;

  @IsOptional()
  @IsString()
  observations: string;

  @IsOptional()
  @IsInt()
  numberOfPaymentsAdvisor: number;
}
