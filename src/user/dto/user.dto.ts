import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsEmail, 
  IsEnum, 
  MinLength, 
  MaxLength,
  Matches,
  IsBoolean
} from 'class-validator';
import { ROLES } from '@/constants/roles';

export class UserDTO {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  firstName: string;

  @IsOptional()
  @IsString({ message: 'El segundo nombre debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El segundo nombre no puede tener más de 50 caracteres' })
  secondName: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede tener más de 50 caracteres' })
  surname: string;

  @IsOptional()
  @IsString({ message: 'El segundo apellido debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El segundo apellido no puede tener más de 50 caracteres' })
  secondSurname: string;

  @IsNotEmpty({ message: 'El nombre de usuario es requerido' })
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'El nombre de usuario no puede tener más de 30 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'El nombre de usuario solo puede contener letras, números y guiones bajos' })
  userName: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @MaxLength(100, { message: 'El email no puede tener más de 100 caracteres' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede tener más de 100 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, { 
    message: 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial' 
  })
  password: string;

  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsEnum(ROLES, { message: 'El rol debe ser un valor válido' })
  role: ROLES;
}

export class UpdateUserDTO {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'El segundo nombre debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El segundo nombre no puede tener más de 50 caracteres' })
  secondName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede tener más de 50 caracteres' })
  surname?: string;

  @IsOptional()
  @IsString({ message: 'El segundo apellido debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El segundo apellido no puede tener más de 50 caracteres' })
  secondSurname?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'El nombre de usuario no puede tener más de 30 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'El nombre de usuario solo puede contener letras, números y guiones bajos' })
  userName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @MaxLength(100, { message: 'El email no puede tener más de 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede tener más de 100 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, { 
    message: 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial' 
  })
  password?: string;

  @IsOptional()
  @IsEnum(ROLES, { message: 'El rol debe ser un valor válido' })
  role?: ROLES;

  @IsOptional()
  @IsBoolean({ message: 'mustChangePassword debe ser un valor booleano' })
  mustChangePassword?: boolean;
}
