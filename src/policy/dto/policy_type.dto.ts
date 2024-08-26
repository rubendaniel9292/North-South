import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class PolicyType {
  @IsNotEmpty()
  @IsString()
  policyName: string;
}

export class UpdatePolicyType {
  @IsOptional()
  @IsString()
  policyName: string;
}
