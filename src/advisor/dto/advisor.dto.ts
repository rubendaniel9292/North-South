import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
export class AdvisorDTO {
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
  @IsDate()
  birthdate: Date;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  numberPhone: string;

  @IsNotEmpty()
  @IsBoolean()
  personalData: boolean;
}
export class UpDateAdvisorDTO {
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
  @IsDate()
  birthdate: Date;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  numberPhone: string;

  @IsOptional()
  @IsBoolean()
  personalData: boolean;
}
