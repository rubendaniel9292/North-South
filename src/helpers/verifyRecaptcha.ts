import axios from 'axios';
//import { ErrorManager } from './error.manager';
export async function verifyRecaptcha(captchaToken: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Clave secreta de reCAPTCHA
  //const secretKey = '6LczPmgqAAAAAH95x7TvNS3VbJSTchN19aU3WEvY'; // Clave secreta de reCAPTCHA

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
