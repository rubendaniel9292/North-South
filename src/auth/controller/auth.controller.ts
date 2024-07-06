import { AuthService } from './../services/auth.service';
import { LoginDto } from '../dto/auth.dto';
import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PublicAcces } from '../decorators/decorators';
import { AuthGuard } from '../guards/auth.guard';

@Controller('auth')
//guardian para los endpoints, se requeiere autorizacion con token para su ejecucion
@UseGuards(AuthGuard)
export class AuthController {
  constructor(private readonly authServices: AuthService) {}
  @PublicAcces()
  @Post('login') //metodo de login con acceso publico, no requiere autorizacion
  async login(@Body() loginDto: LoginDto) {
    const { username, password } = loginDto;
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
