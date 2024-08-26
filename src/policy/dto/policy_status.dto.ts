import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class PolicyStatus {
  @IsNotEmpty()
  @IsString()
  status_name: string;
}

export class UpdatePolicyStatus {
  @IsOptional()
  @IsString()
  status_name: string;
}
