/* eslint-disable @typescript-eslint/no-namespace */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace Express {
  interface Request {
    idUser: string;
    roleUser: string;
  }
}
