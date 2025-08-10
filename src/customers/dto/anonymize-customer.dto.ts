import { IsString, IsOptional, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class AnonymizeCustomerDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string; // Motivo de la anonimización (obligatorio para auditoría)

  @IsString()
  @IsOptional()
  legalBasis?: string; // Base legal: 'USER_REQUEST', 'RETENTION_EXPIRED', 'LEGAL_OBLIGATION'

  @IsString()
  @IsOptional()
  authorizedBy?: string; // Usuario que autoriza la anonimización

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'El número de solicitud debe contener solo letras mayúsculas, números y guiones'
  })
  requestNumber?: string; // Número de solicitud física (ej: "SOL-LOPD-2025-001")
}

export class AnonymizationResponseDTO {
  success: boolean;
  message: string;
  customerData: {
    id: number;
    isAnonymized: boolean;
    anonymizationDate: Date;
    activePoliciesCount: number;
  };
}

export class CanAnonymizeResponseDTO {
  canAnonymize: boolean;
  restrictions: string[];
  activePolicies: number;
  suggestions: string[];
}
