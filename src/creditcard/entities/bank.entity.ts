import { IdEntity } from '../../config/id.entity';
import { IBank } from 'src/interface/all.Interfaces';
import {
  Column,
  //CreateDateColumn,
  Entity,
  OneToMany,
  // JoinColumn,
  //ManyToOne,
} from 'typeorm';
import { CreditCardEntity } from './credit.card.entity';

@Entity({ name: 'bank' })
export class BankEntity extends IdEntity implements IBank {
  @Column({ unique: true })
  bankName: string;

  // Relación uno a varios: un banco emite muchas tarjetas
  @OneToMany(() => CreditCardEntity, (creditcard) => creditcard.bank, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  creditcard: CreditCardEntity[];
}
