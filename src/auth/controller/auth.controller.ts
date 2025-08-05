import { AuthService } from './../services/auth.service';
import { LoginDto } from '../dto/auth.dto';
import { ChangePasswordDTO } from '../dto/ChangePasswordDTO';
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
    console.log('=== INICIO DE LOGIN ===');
    /*
    console.log('Datos recibidos:', { 
      username: loginDto.username, 
      passwordLength: loginDto.password?.length,
      hasTurnstileToken: !!loginDto.turnstileToken 
    });
*/
    const { username, password, turnstileToken } = loginDto;

    // 1. VERIFICAR TURNSTILE TOKEN
    if (!turnstileToken) {
      console.error('❌ TurnstileToken no proporcionado');
      throw new BadRequestException('Token de Turnstile requerido');
    }

    try {
      console.log('🔒 Verificando Turnstile token...');
      await this.turnstileService.verifyToken(turnstileToken as string);
      console.log('✅ Turnstile token válido');
    } catch (error) {
      console.error('❌ Fallo en verificación de Turnstile:', error.message);
      throw new BadRequestException('Fallo en la verificación de turnstileToken');
    }

    // 2. VALIDAR USUARIO Y CONTRASEÑA
    try {
      console.log('🔑 Validando credenciales para usuario', /*username*/);
      const validateResult = await this.authServices.validateUser(username, password);
      
      if (!validateResult) {
        console.error('❌ Credenciales inválidas para usuario:'/*, username*/);
        throw new UnauthorizedException('Usuario o contraseña incorrectos');
      }

      console.log('✅ Credenciales válidas');
      const { user, mustChangePassword } = validateResult;
      
      // 3. VERIFICAR SI DEBE CAMBIAR CONTRASEÑA
      if (mustChangePassword) {
        console.log('⚠️ Usuario debe cambiar contraseña');
        return {
          status: 'must_change_password',
          message: 'Debes cambiar tu contraseña antes de continuar.',
          mustChangePassword: true,
          userId: user.uuid,
        };
      }

      // 4. GENERAR JWT
      console.log('🎫 Generando JWT para usuario exitoso');
      const jwt = await this.authServices.generateJWT(user);
      console.log('✅ Login completado exitosamente');
      
      return jwt;
      
    } catch (error) {
      console.error('❌ Error durante validación:', error.message);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error interno durante el login');
    }
  }

  @PublicAcces()
  @Post('change-password')
  async changePassword(@Body() body: ChangePasswordDTO) {
    const { userId, newPassword } = body;
    const ok = await this.authServices.changePassword(userId, newPassword);
    if (!ok) {
      throw new BadRequestException('No se pudo cambiar la contraseña');
    }
    return {
      status: 'success',
      message: 'Contraseña cambiada correctamente. Ahora puedes iniciar sesión.',
      ok
    };
  }
}
