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
    const cachedUser = await this.redisService.get(`user:${username}`);

    const getUserFlag = (user: any) => {
      const { password, mustChangePassword, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        mustChangePassword: mustChangePassword ?? true, // Si no existe, por defecto true
      };
    };

    if (cachedUser) {
      const match = await bcrypt.compare(password, cachedUser.password);
      if (match) return getUserFlag(cachedUser);
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
          await this.redisService.set(`user:${username}`, userByUsername, 3600);
          return getUserFlag(userByUsername);
        }
      }

      if (userByEmail) {
        const match = await bcrypt.compare(password, userByEmail.password);
        if (match) {
          await this.redisService.set(`user:${username}`, userByEmail, 3600);
          return getUserFlag(userByEmail);
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
    const user = await this.userService.findUserById(userId);
    if (!user) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.updateUser(userId, {
      password: hashedPassword,
      mustChangePassword: false,
    });
    await this.redisService.del(`user:${user.userName}`);
    return true;
  }
}