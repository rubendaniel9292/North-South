import { PrimaryGeneratedColumn } from 'typeorm';
//clase abstrcta para campos comunes en todas las entidades, no se peude isntanciar pero si heredar
export abstract class IdEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;
}
