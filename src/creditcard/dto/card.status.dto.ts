import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
// cardName: string;
export class StatusCardDTO {
  @IsNotEmpty()
  @IsString()
  cardStatusName: string;
}

export class UpdateCardOptionDTO {
  @IsOptional()
  @IsString()
  cardStatusName: string;
}
