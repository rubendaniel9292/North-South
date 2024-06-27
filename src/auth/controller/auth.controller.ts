import { AuthBody } from 'src/interface/auth.interfaces';
import { AuthService } from './../services/auth.service';
import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authServices: AuthService) {}
  @Post('login')
  async login(@Body() { username, password }: AuthBody) {
    const userValidate = await this.authServices.validateUser(
      username,
      password,
    );
    //si la contraseña es incorrecta genera un error,caso contrario se genera la firma del token
    if (!userValidate) {
      throw new UnauthorizedException('Data not valid');
    }
    const jwt = await this.authServices.generateJWT(userValidate);
    return jwt;
  }
}
