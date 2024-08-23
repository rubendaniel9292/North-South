import {
  Column,
  //CreateDateColumn,
  Entity,
  OneToMany,
  // JoinColumn,
  //ManyToOne,
} from 'typeorm';

import { ICardStatus } from '@/interface/all.Interfaces';
import { IdEntity } from '@/config/id.entity';
import { CreditCardEntity } from './credit.card.entity';

@Entity({ name: 'card_status' })
export class CardStatusEntity extends IdEntity implements ICardStatus {
  @Column({ unique: true })
  cardStatusName: string;

  // Relación uno a varios: un estado pertenece a muchas tarjetas
  @OneToMany(() => CreditCardEntity, (creditcard) => creditcard.cardstatus, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  creditcard: CreditCardEntity[];
}
