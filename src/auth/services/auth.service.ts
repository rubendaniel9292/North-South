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
  // Método para validar el usuario, busca el usuario y compara las contraseñas
  public validateUser = async (username: string, password: string) => {
    const cachedUser = await this.redisService.get(`user:${username}`);

    if (cachedUser) {
      const { password: cachedPassword, ...userWithoutPassword } = cachedUser; // Separar el usuario y la contraseña
      const match = await bcrypt.compare(password, cachedPassword);
      if (match) return userWithoutPassword; // Devuelve el usuario sin la contraseña
    } else {
      const userByUsername = await this.userService.findAndCompare({
        key: 'userName',
        value: username,
      });
      const userByEmail = await this.userService.findAndCompare({
        key: 'email',
        value: username,
      });

      if (userByUsername) {
        const match = await bcrypt.compare(password, userByUsername.password);
        if (match) {
          await this.redisService.set(`user:${username}`, {
            ...userByUsername,
            password: userByUsername.password, // Almacenar la contraseña cifrada en Redis
          }, 3600);
          const { password, ...userWithoutPassword } = userByUsername;
          return userWithoutPassword; // Devuelve el usuario sin la contraseña
        }
      }

      if (userByEmail) {
        const match = await bcrypt.compare(password, userByEmail.password);
        if (match) {
          await this.redisService.set(`user:${username}`, {
            ...userByEmail,
            password: userByEmail.password, // Almacenar la contraseña cifrada en Redis
          }, 3600);
          const { password, ...userWithoutPassword } = userByEmail;
          return userWithoutPassword; // Devuelve el usuario sin la contraseña
        }
      }
    }

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
  })

    : string {
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
}