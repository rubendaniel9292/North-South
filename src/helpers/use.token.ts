import { AuthTokenResult, IUseToken } from 'src/interface/auth.interfaces';
import * as jwt from 'jsonwebtoken';

//metodo para usar el token
export const useToken = (token: string): IUseToken | string => {
  try {
    const decode = jwt.decode(token) as AuthTokenResult;
    const currentDate = new Date();
    const expiresDate = new Date(decode.exp);
    return {
      sub: decode.sub,
      role: decode.role,
      isExpired: +expiresDate <= +currentDate / 1000, //Convierte expiresDate y currentDate en su equivalente numérico y Convierte currentDate a milisegundos y luego lo divide por 1000 para obtener el tiempo en segundo
    };
  } catch (error) {
    return 'Token is invalid';
  }
};
