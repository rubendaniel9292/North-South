// auth/dto/login.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;

  @IsNotEmpty()
  @IsString()
  turnstileToken: string;
}
