import { ADMIN_KEY, PUBLIC_KEY, ROLES_KEY } from '@/constants/key-decorator';
import { ROLES } from '@/constants/roles';
import { SetMetadata } from '@nestjs/common';

//el guard pueda leer los endponts dentro del controler
export const PublicAcces = () => SetMetadata(PUBLIC_KEY, true);

//el guard pueda leer los endponts dentro del controler
export const AdminAcces = () => SetMetadata(ADMIN_KEY, ROLES.ADMIN);

export const Roles = (...roles: Array<keyof typeof ROLES>) =>
  SetMetadata(ROLES_KEY, roles);
