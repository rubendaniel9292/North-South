import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CompanyDTO {
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsNotEmpty()
  @IsString()
  ci_ruc: string;
}

export class UpdateCompanyDTO {
  @IsOptional()
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  ci_ruc: string;
}
