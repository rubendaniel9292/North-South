export class PolicyReportDTO {
  numberPolicy: string;
  coverageAmount: string;
  agencyPercentage: string;
  advisorPercentage: string;
  policyValue: string;
  numberOfPayments: number;
  startDate: Date;
  endDate: Date;
  policyFee: string;
  paymentsToAdvisor: string;
  observations?: string;
  renewalCommission: boolean;

  // Sub-objetos anidados dentro de la misma clase
  policyType: {
    policyName: string;
  };

  policyStatus: {
    id: string;
    statusName: string;
  };

  paymentFrequency: {
    id: string;
    frequencyName: string;
  };

  company: {
    companyName: string;
  };

  advisor: {
    firstName: string;
    secondName?: string;
    surname: string;
    secondSurname?: string;
  };

  customer: {
    ci_ruc: string;
    firstName: string;
    secondName?: string;
    surname: string;
    secondSurname?: string;
  };

  paymentMethod: {
    methodName: string;
  };

  bankAccount?: {
    bank_id: string;
    bank: {
      bankName: string;
    };
  };

  creditCard?: {
    bank_id: string;
    bank: {
      bankName: string;
    };
  };

  payments: Array<{
    id: number;
    number_payment: number;
    pending_value: number;
    value: string;
    credit: string;
    balance: string;
    total: string;
    observations?: string;
    policy_id: number;
    createdAt: Date;
    updatedAt: Date;
    paymentStatus: {
      id: number;
      statusNamePayment: string;
    };
  }>;
  renewals: Array<{
    id: string;
    renewalNumber: string;
    policy_id: string;
    createdAt: Date;
    observations: string;
  }>;
}
