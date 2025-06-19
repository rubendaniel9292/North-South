import { IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
export class CommissionsDTO {
    @IsNotEmpty()
    @IsString()
    receiptNumber: string;

    @IsNotEmpty()
    @IsNumber()
    advanceAmount: number;

    @IsNotEmpty()
    @IsDate()
    createdAt: Date;

    @IsOptional()
    @IsString()
    observations?: string;

    @IsNotEmpty()
    @IsInt()
    advisor_id: number;

    @IsNotEmpty()
    @IsInt()
    payment_method_id: number;

    @IsOptional()
    @IsInt()
    company_id?: number | null; // Campo opcional para la compañía asociada a la comisión

    @IsOptional()
    @IsInt()
    policy_id?: number[] | null; // Campo opcional para la poliza a la comisión

    @IsOptional()
    @IsInt()
    status_advance_id?: number | null; // Campo opcional para el estado del anticipo

    @IsOptional()
    @IsNumber()
    parent_advance_id?: number | null;

}