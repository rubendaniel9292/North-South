import { IAdvisor } from '@/interface/all.Interfaces';
import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class IdCustomEntity implements IAdvisor {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ unique: true })
  ci_ruc: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  secondName?: string;

  @Column({ nullable: true })
  surname?: string;

  @Column({ nullable: true })
  secondSurname?: string;

  @Column()
  birthdate: Date;

  @Column({ unique: false })
  email: string;

  @Column()
  numberPhone: string;

  @Column({ type: 'boolean' })
  personalData: boolean;
}
