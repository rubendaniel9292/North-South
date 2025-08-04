import { 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsInt
} from 'class-validator';

export class TaskDTO {
  @IsNotEmpty({ message: 'El UUID del usuario es requerido' })
  @IsString({ message: 'El UUID del usuario debe ser una cadena de texto' })
  @IsUUID('4', { message: 'El UUID del usuario debe ser un UUID válido' })
  users_uuid: string;

  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'La descripción no puede tener más de 500 caracteres' })
  description: string;

  @IsNotEmpty({ message: 'El estado de la tarea es requerido' })
  @IsInt({ message: 'El estado de la tarea debe ser un número entero' })
  @Min(0, { message: 'El estado de la tarea debe ser mayor o igual a 0' })
  @Max(2, { message: 'El estado de la tarea debe ser menor o igual a 2' })
  statusTask: number;
}

export class UpdateTaskDTO {
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'La descripción no puede tener más de 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'El estado de la tarea debe ser un número entero' })
  @Min(0, { message: 'El estado de la tarea debe ser mayor o igual a 0' })
  @Max(2, { message: 'El estado de la tarea debe ser menor o igual a 2' })
  statusTask?: number;
}
