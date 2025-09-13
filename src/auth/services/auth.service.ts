import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt-updated';
import * as jwt from 'jsonwebtoken';

import crypto from 'crypto';
import { PayloadToken } from '@/interface/auth.interfaces';
import { UserEntity } from '@/user/entities/user.entity';
import { UserService } from '@/user/services/user.service';
import { RedisModuleService } from '@/redis-module/services/redis-module.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly redisService: RedisModuleService) { }
  //1: metodo para validar el usuario. busca el usuario y compara las contraseñas

  public validateUser = async (username: string, password: string) => {
    console.log('🔍 AuthService.validateUser iniciado', /*username*/);
    //console.log('🔍 Password length:', password?.length);

    // Verificar caché primero
    try {
      const cachedUser = await this.redisService.get(`user:${username}`);
      //console.log('📦 Usuario en caché:', !!cachedUser);

      const getUserFlag = (user: any) => {
        const { password: userPassword, mustChangePassword, ...userWithoutPassword } = user;
        const result = {
          user: userWithoutPassword,
          mustChangePassword: mustChangePassword ?? true, // Si no existe, por defecto true
        };
        /*
        console.log('🏁 getUserFlag result:', {
          userId: userWithoutPassword.uuid,
          mustChangePassword: result.mustChangePassword
        });
        */
        return result;
      };

      // Si hay usuario en caché
      if (cachedUser) {
        console.log('✅ Usuario encontrado en caché');
        //console.log('🔐 Comparing passwords - cachedUser.password exists:', !!cachedUser.password);
        const match = await bcrypt.compare(password, cachedUser.password);
        console.log('🔐 Comparación de contraseña (caché):', match);
        if (match) return getUserFlag(cachedUser);
      } else {
        console.log('❌ Usuario no encontrado en caché, buscando en BD');

        // Buscar por username
        // console.log('👤 Buscando por username:', username);
        const userByUsername = await this.userService.findAndCompare({
          key: 'userName',
          value: username,
        });
        /*
        console.log('👤 Usuario por username encontrado:', !!userByUsername);
        if (userByUsername) {
          console.log('👤 UserByUsername data:', { 
            id: userByUsername.uuid, 
            userName: userByUsername.userName,
            hasPassword: !!userByUsername.password 
          });
        }
*/
        if (userByUsername) {
          console.log('🔐 Validando credenciales para usuario encontrado');
          
          // Verificar si es texto plano (solo para debugging en desarrollo)
          if (password === userByUsername.password) {
            console.log('⚠️ ALERTA SEGURIDAD: Contraseña en texto plano detectada');
            await this.redisService.set(`user:${username}`, userByUsername, 3600);
            return getUserFlag(userByUsername);
          }
          
          const match = await bcrypt.compare(password, userByUsername.password);
          if (match) {
            console.log('💾 Guardando usuario en caché');
            await this.redisService.set(`user:${username}`, userByUsername, 3600);
            return getUserFlag(userByUsername);
          }
        }

        // Buscar por email
        console.log('📧 Buscando por email como método alternativo');
        const userByEmail = await this.userService.findAndCompare({
          key: 'email',
          value: username,
        });

        if (userByEmail) {
          console.log('� Validando credenciales para email encontrado');
          const match = await bcrypt.compare(password, userByEmail.password);
          if (match) {
            console.log('💾 Login exitoso por email, guardando en caché');
            await this.redisService.set(`user:${username}`, userByEmail, 3600);
            return getUserFlag(userByEmail);
          }
        }
      }

    } catch (error) {
      console.error('💥 Error durante validateUser:', error.message);
      console.error('💥 Stack trace:', error.stack);
    }

    console.log('❌ Validación fallida - usuario o contraseña incorrectos');
    return null;
  };

  //2: metodo para general la firma del token, este sera aleatorio y rotativo
  //const: secret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
  public singJWT({
    payload,
    secret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
    expires,
  }: {
    payload: jwt.JwtPayload;
    secret: string;
    expires: number | string;
  }): string {
    //toma el payload, lo codifica como JSON y lo firma utilizando el algoritmo especificado y el secret
    //return jwt.sign(payload, secret, { expiresIn: expires });
    return jwt.sign(payload, secret, {
      expiresIn: expires,
    } as jwt.SignOptions);
  }


  //3: metodo para generacion del token

  public generateJWT = async (user: UserEntity): Promise<any> => {
    const getUser = await this.userService.findUserById(user.uuid);
    const payload: PayloadToken = {
      role: getUser.role,
      sub: getUser.uuid,
    };
    // Eliminar la contraseña del usuario antes de devolverlo. funciona solo al probar en postman de ahi que sa necesario usar el reflector en main
    delete getUser.password;
    delete getUser.userName;

    //retornar la informacion que quiero enviar
    return {
      status: 'success',
      accessToken: this.singJWT({
        payload,
        secret:
          process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
        expires: '9h',
      }),
      user: getUser,
    };
  };

  //4: Metodo para cambiar la contraseña al primer inicio de secion
  public async changePassword(userId: string, newPassword: string): Promise<boolean> {
    console.log('🔄 AuthService.changePassword - Iniciando cambio de contraseña para userId:'/*, userId*/);

    const user = await this.userService.findUserById(userId);
    if (!user) {
      console.log('❌ Usuario no encontrado para cambio de contraseña');
      return false;
    }

    console.log('✅ Usuario encontrado, actualizando contraseña (sin hashear - el UserService se encarga)');
    // No hasheamos aquí porque UserService.updateUser ya se encarga del hashing
    await this.userService.updateUser(userId, {
      password: newPassword, // Pasamos la contraseña sin hashear
      mustChangePassword: false,
    });

    console.log('🗑️ Limpiando caché del usuario');
    await this.redisService.del(`user:${user.userName}`);
    await this.redisService.del(`user:${user.email}`); // También limpiar cache por email

    console.log('✅ Cambio de contraseña completado exitosamente');
    return true;
  }
}