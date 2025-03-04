import { AuthService } from './../services/auth.service';
import { LoginDto } from '../dto/auth.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PublicAcces } from '../decorators/decorators';
import { AuthGuard } from '../guards/auth.guard';
import { TurnstileService } from '@/turnstile/services/turnstile.service';
//import { verifyRecaptcha } from '@/helpers/verifyRecaptcha';

@Controller('auth')
//guardian para los endpoints, se requeiere autorizacion con token para su ejecucion
@UseGuards(AuthGuard)
export class AuthController {
  //turnstileService: any;
  constructor(
    private readonly authServices: AuthService,
    private readonly turnstileService: TurnstileService,
  ) { }
  @PublicAcces()
  @Post('login') //metodo de login con acceso publico, no requiere autorizacion
  async login(@Body() loginDto: LoginDto) {
    console.log(
      '1: iniciando verificacion de token recapcha en el controlador',
    );

    const { username, password, turnstileToken } = loginDto;
    //console.log(turnstileToken);
    //const { username, password } = loginDto;
    // Verificar reCAPTCHA antes de autenticar al usuario
    //console.log('token de  Turnstile: ', turnstileToken);
    /*
  
    const isHuman = await verifyRecaptcha(captchaToken);
    console.log('2: acceso al helper de verificacion de capcha exitoso');
    if (!isHuman) {
      throw new BadRequestException('Fallo en la verificación de reCAPTCHA.');
    }*/
    // Verificar el turnstileToken
    try {
      await this.turnstileService.verifyToken(turnstileToken as string);
    } catch (error) {
      console.error('**Fallo en la verificación de turnstileToken**')
      throw new BadRequestException('Fallo en la verificación de turnstileToken');

    }
    const userValidate = await this.authServices.validateUser(
      username,
      password,
    );
    //si la contraseña es incorrecta genera un error,caso contrario se genera la firma del token
    if (!userValidate) {
      console.error('**Usuario o contraseña incorrectos**')
      throw new UnauthorizedException('Data not valid');
    }
    const jwt = await this.authServices.generateJWT(userValidate);
    console.error('Login exitoso...')
    return jwt;
  }
}
