import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class CompanyDTO {
  @IsNotEmpty()
  @IsString()
  companyName: string;
  ci_ruc: string;
}

export class UpdateCompanyDTO {
  @IsOptional()
  @IsString()
  companyName: string;
  ci_ruc: string;
}
