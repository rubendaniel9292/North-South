import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class PolicyStatus {
  @IsNotEmpty()
  @IsString()
  statusName: string;
}

export class UpdatePolicyStatus {
  @IsOptional()
  @IsString()
  statusName: string;
}
