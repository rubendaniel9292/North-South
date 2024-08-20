import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
// cardName: string;
export class CardOptionDTO {
  @IsNotEmpty()
  @IsString()
  cardName: string;
}

export class UpdateCardOptionDTO {
  @IsOptional()
  @IsString()
  cardName: string;
}
