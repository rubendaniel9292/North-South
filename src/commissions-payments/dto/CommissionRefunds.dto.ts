import { IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
export class CommissionRefundsDTO {
   

    @IsNotEmpty()
    @IsInt()
    policy_id: number;

    @IsNotEmpty()
    @IsInt()
    advisor_id: number;

    @IsNotEmpty()
    @IsNumber()
    amountRefunds: number;

    @IsNotEmpty()
    @IsString()
    reason: string;

    @IsNotEmpty()
    @IsDate()
    cancellationDate: Date;
}