/*tipos en TypeScript para las variables de entorno. 
Esta declaración ayuda a mejorar la seguridad y 
la autocompletación del código en tiempo de desarrollo 
al asegurarse de que las variables de entorno que se usan en la aplicación 
sean explícitamente declarada 
Esta declaración define una interfaz para el objeto 
ProcessEnv dentro del espacio de nombres NodeJS. 
ProcessEnv es una interfaz proporcionada por Node.js 
que contiene las variables de entorno de la aplicación. 
Al extender esta interfaz, estás especificando exactamente 
qué variables de entorno se esperan y qué tipo de datos deberían contene*/
/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    HASH_SALT: string;
    JWT_SECRET: string;
    URL: string;
    PWD_CARD: string;
    RECAPTCHA_SECRET_KEY: string;
    //POSTGRES_DB: string;
    //POSTGRES_USER: string;
    //POSTGRES_PASSWORD: string;
    //CONTAINER_NAME: string;
  }
}
