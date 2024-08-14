import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { useToken } from 'src/helpers/use.token';
import { IUseToken } from 'src/interface/auth.interfaces';
import { UserService } from 'src/user/services/user.service';
import { Request } from 'express';
import { PUBLIC_KEY } from 'src/constants/key-decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UserService,
    private readonly reflector: Reflector, //leer atributos de decoradores
  ) {}
  async canActivate(context: ExecutionContext) {
    //leer del decorador publico si existe dejarlo pasar
    const isPublic = this.reflector.get<boolean>(
      PUBLIC_KEY,
      context.getHandler(),
    );

    // Si la ruta es pública y no es privada, permite el acceso sin token
    if (isPublic) {
      return true;
    }

    //caso contrario, crear argumentos para empezar a leer el header de la funcion
    const req = context.switchToHttp().getRequest<Request>();
    //const token = req.headers['token']; //llegada del token en el header
    //si el token no existe o el token es de tipo array
    /*req.headers['authorization'] devolverá la cadena "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9".
    ?. verifica que req.headers['authorization'] no sea undefined o null.
    .split(' ') dividirá la cadena en ['Bearer', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'].
    [1] accederá al segundo elemento del array, es decir, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'.
    
    */
    // Si es privada, el token debe estar presente
    //const token = req.headers['Authorization'];
    //const token = req.headers['authorization']?.split(' ')[1];(no funciona)

    const token = req.headers['token'];
    console.log(token);
    if (!token || Array.isArray(token)) {
      throw new UnauthorizedException('Invalid token');
    }
    //manejar manejar el tojen
    const manageToken: IUseToken | string = useToken(token);
    //validar si el managetonek es un string, debe ser objeto

    if (typeof manageToken === 'string') {
      throw new UnauthorizedException(manageToken);
    }
    //validar si el token es valido  o no esta expirado
    if (manageToken.isExpired) {
      throw new UnauthorizedException('Token is expired');
    }
    //desestrucutrar objeto con la fecha de expliracion
    const { sub } = manageToken;
    //buscar el usuario comppleto
    const user = await this.usersService.findUserById(sub);
    //sino existe el usuario es invalido
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }
    //inyeccion de informacion de reques
    req.idUser = user.uuid;
    req.roleUser = user.role;
    //req['user'] = user;
    return true;
  }
}
