import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDate,
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
}
