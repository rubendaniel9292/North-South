import { PUBLIC_KEY, ROLES_KEY, ADMIN_KEY } from '@/constants/key-decorator';
import { ROLES } from '@/constants/roles';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector, //leer atributos de decoradores
  ) {}

  canActivate(context: ExecutionContext) {
    //leer del corador publico si existe dejarlo pasar
    const isPublic = this.reflector.get<boolean>(
      PUBLIC_KEY,
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }
    const roles = this.reflector.get<Array<keyof typeof ROLES>>(
      ROLES_KEY,
      context.getHandler(),
    );
    //const roleUser = req['user']?.role; // Suponiendo que 'user' tiene la información del rol
    //console.log('Role del usuario:', roleUser);
    const req = context.switchToHttp().getRequest<Request>();

    const admin = this.reflector.get<string>(ADMIN_KEY, context.getHandler());
    console.log(admin);
    //const { roleUser } = req['user']?.role; // Suponiendo que 'user' tiene la información del rol;
    const { roleUser } = req;
    //console.log('Role del usuario:', roleUser);
    //validar sino le paso el decorar, le asigne que es el nivel mas basica execto a ciertas rutas o metodos
    if (roles === undefined) {
      //y sino hay niveles de administracion
      if (!admin) {
        return true;
      } else if (admin && roleUser === admin) {
        //sigifica que esoy administrador
        return true;
      } else {
        throw new UnauthorizedException(
          'No tienes permisos para realizar esta operacion',
        );
      }
    }
    if (roleUser === ROLES.ADMIN) {
      return true;
    }
    //comprobar si hay otros roles
    const isAuth = roles.some((role) => role === roleUser); //buscar un elemento
    console.log(isAuth);
    if (!isAuth)
      throw new UnauthorizedException('No tienes permisos para esta operacion');
    console.log('Role del usuario:', roleUser);
    return true;
  }
}
