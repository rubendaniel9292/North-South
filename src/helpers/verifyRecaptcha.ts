import axios from 'axios';
//import { ErrorManager } from './error.manager';
export async function verifyRecaptcha(captchaToken: string): Promise<boolean> {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.error('La clave secreta RECAPTCHA_SECRET_KEY no está definida.');
  }

  const secretKey = String(process.env.RECAPTCHA_SECRET_KEY);
  console.log('clave secreta: ', secretKey);

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: secretKey,
          response: captchaToken,
        },
      },
    );

    const data = response.data;
    console.log('response de la solicitud de recapcha: ', data);

    if (data.success && data.score > 0.5) {
      // El token es válido y tiene buena puntuación
      return true;
    } else {
      // El token no es válido o tiene baja puntuación
      console.error('reCAPTCHA falló', data);
      return false;
    }
  } catch (error) {
    return false;
    //throw ErrorManager.createSignatureError(error.message);
  }
}
