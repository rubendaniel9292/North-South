import { IdEntity } from '@/config/id.entity';
import { ICardOption } from '@/interface/all.Interfaces';
import {
  Column,
  //CreateDateColumn,
  Entity,
  OneToMany,
  // JoinColumn,
  //ManyToOne,
} from 'typeorm';
import { CreditCardEntity } from './credit.card.entity';

@Entity({ name: 'card_options' })
export class CardOptionsEntity extends IdEntity implements ICardOption {
  @Column({ unique: true })
  cardName: string;

  // Relación uno a muchos: un tipo de tarjeta puede tener muchas tarjetas
  @OneToMany(() => CreditCardEntity, (creditcard) => creditcard.cardoption, {
    onDelete: 'RESTRICT', // No permite la eliminación en cascada
  })
  creditcard: CreditCardEntity[];
}
