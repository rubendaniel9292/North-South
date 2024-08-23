import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
export class CustomerDTO {
  @IsNotEmpty()
  @IsString()
  ci_ruc: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  secondName: string;

  @IsNotEmpty()
  @IsString()
  surname: string;

  @IsOptional()
  @IsString()
  secondSurname: string;

  @IsNotEmpty()
  @IsInt()
  status_id: number;

  @IsNotEmpty()
  @IsDate()
  birthdate: Date;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  numberPhone: string;

  @IsNotEmpty()
  @IsInt()
  province_id: number;

  @IsNotEmpty()
  @IsInt()
  city_id: number;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false')) //transformando al fomarto correcto
  personalData: boolean;
}
export class UpDateCustomerDTO {
  //posteriormente se eliminaran las siguietnes lineas cuando se validen los datos atraves de una api externa
  @IsOptional()
  @IsString()
  ci_ruc: string;

  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  secondName: string;

  @IsOptional()
  @IsString()
  surname: string;

  @IsOptional()
  @IsString()
  secondSurname: string;

  @IsOptional()
  @IsInt()
  status_id: number;

  @IsOptional()
  @IsDate()
  birthdate: Date;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  numberPhone: string;

  @IsOptional()
  @IsInt()
  province_id: number;

  @IsOptional()
  @IsInt()
  city_id: number;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsBoolean()
  personalData: boolean;
}
