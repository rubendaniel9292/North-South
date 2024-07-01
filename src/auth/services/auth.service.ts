import { UserService } from './../../user/services/user.service';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt-updated';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from 'src/user/entities/user.entity';
import { PayloadToken } from '../../interface/auth.interfaces';
import crypto from 'crypto';
@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}
  //1: metodo para validar el usuario. busca el usuario y compara las contraseñas
  public validateUser = async (username: string, password: string) => {
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
      if (match) return userByUsername;
    }
    if (userByEmail) {
      const match = await bcrypt.compare(password, userByEmail.password);
      if (match) return userByEmail;
    }
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
  }) {
    //toma el payload, lo codifica como JSON y lo firma utilizando el algoritmo especificado y el secret
    return jwt.sign(payload, secret, { expiresIn: expires });
  }

  //3: metodo para generacion del token

  public generateJWT = async (user: UserEntity): Promise<any> => {
    const getUser = await this.userService.findUserById(user.id);
    const payload: PayloadToken = {
      role: getUser.role,
      sub: getUser.id,
    };
    // Eliminar la contraseña del usuario antes de devolverlo
    delete getUser.password;
    //retornar la informacion que quiero enviar
    return {
      accesToken: this.singJWT({
        payload,
        secret:
          process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
        expires: '1h',
      }),
      user: getUser,
    };
  };
}
