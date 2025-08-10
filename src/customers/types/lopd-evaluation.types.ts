// Tipos para evaluación LOPD
export interface LOPDException {
  article: string;
  reason: string;
  details: string;
  blocksElimination: boolean;
}

export interface EliminationEvaluationResult {
  canEliminate: boolean;
  exceptions: LOPDException[];
  recommendedAction: 'PROCEDER' | 'RECHAZAR' | 'REVISAR_MANUAL';
  legalResponse: string;
  earliestEliminationDate?: Date;
  activePoliciesCount: number;
  nextReviewDate?: Date;
}

export interface PolicyRetentionInfo {
  policyId: number;
  numberPolicy: string;
  endDate: Date;
  status: string;
  yearsRemaining: number;
  requiresRetention: boolean;
  retentionReason: string;
}

export interface LegalRetentionRequirement {
  required: boolean;
  authority: string;
  reason: string;
  endDate?: Date;
}

export enum EliminationRequestStatus {
  PENDING_EVALUATION = 'PENDING_EVALUATION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED'
}
