import { IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PolicyPeriodDataDTO {
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    policy_id: number;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    year: number;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    policyValue: number;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    policyFee: number;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    agencyPercentage: number;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    advisorPercentage: number;
}