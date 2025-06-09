import { IsString, MinLength, Matches, IsBoolean } from 'class-validator';

export class ChangePasswordDTO {
  @IsString()
  userId: string; // o el campo UUID que uses

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/, {
    message: 'La contraseña debe contener letras, números y un carácter especial',
  })
  newPassword: string;

}