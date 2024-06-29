import { SetMetadata } from '@nestjs/common';
import { PUBLIC_KEY } from 'src/constants/key-decorators';
//el guard pueda leer los endponts dentro del controler
export const PublicAcces = () => SetMetadata(PUBLIC_KEY, true);
