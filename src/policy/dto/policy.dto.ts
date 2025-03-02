import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDate,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class PolicyDTO {
  @IsNotEmpty()
  @IsString()
  numberPolicy: string;

  @IsNotEmpty()
  @IsInt()
  policy_type_id: number;

  @IsNotEmpty()
  @IsInt()
  company_id: number;

  @IsOptional()
  @IsInt()
  policy_status_id?: number;

  @IsNotEmpty()
  @IsInt()
  payment_frequency_id: number;

  @IsNotEmpty()
  @IsInt()
  advisor_id: number;

  @IsNotEmpty()
  @IsInt()
  payment_method_id: number;

  @IsOptional()
  @IsInt()
  credit_card_id?: number;

  @IsOptional()
  @IsInt()
  bank_account_id?: number;

  @IsNotEmpty()
  @IsInt()
  customers_id: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  coverageAmount: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  agencyPercentage: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  advisorPercentage: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
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
  @IsNumber({ maxDecimalPlaces: 2 })
  paymentsToAdvisor: number;
  
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  paymentsToAgency:number 

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  policyFee?: number;

  @IsNotEmpty()
  @IsInt()
  numberOfPaymentsAdvisor: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsNotEmpty()
  @IsBoolean()
  renewalCommission: boolean;
}

export class UpdatePolicyDTO {
  @IsOptional()
  @IsString()
  numberPolicy: string;

  @IsOptional()
  @IsInt()
  policy_type_id: number;

  @IsOptional()
  @IsInt()
  company_id: number;

  @IsOptional()
  @IsInt()
  policy_status_id?: number;

  @IsOptional()
  @IsInt()
  payment_frequency_id: number;

  @IsOptional()
  @IsInt()
  advisor_id: number;

  @IsOptional()
  @IsInt()
  payment_id: number;

  @IsOptional()
  @IsInt()
  credit_card_id: number;

  @IsOptional()
  @IsInt()
  customers_id: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  coverageAmount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  agencyPercentage: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  advisorPercentage: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
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
  @IsNumber({ maxDecimalPlaces: 2 })
  paymentsToAdvisor: number; // Igual que arriba

  @IsOptional()
  @IsInt()
  numberOfPaymentsAdvisor: number;

  @IsOptional()
  @IsString()
  observations: string;
}
