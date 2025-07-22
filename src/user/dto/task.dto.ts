import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
export class TaskDTO {
    @IsNotEmpty()
    @IsString()
    users_uuid: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    statusTask: number;
}
