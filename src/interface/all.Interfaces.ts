
export interface ICivilStatus {
  status: string;
}

export interface IProvince {
  provinceName: string;
}
export interface ICity {
  cityName: string;
}

export interface ICustomer {
  ci_ruc: string;
  firstName: string;
  secondName?: string;
  surname?: string;
  secondSurname?: string;
  birthdate: Date;
  email: string;
  numberPhone: string;
  address: string;
  personalData: boolean;
}

export interface IPolicyType {
  policyName: string;
}

export interface ICompany {
  companyName: string;
  ci_ruc: string;
}

export interface ICardOption {
  cardName: string;
}

export interface IBank {
  bankName: string;
}
export interface ICardStatus {
  cardStatusName: string;
}

export interface ICreditCard {
  cardNumber: string;
  expirationDate: Date;
  code: string;
}

export interface IAdvisor {
  ci_ruc: string;
  firstName: string;
  secondName?: string;
  surname?: string;
  secondSurname?: string;
  birthdate: Date;
  email: string;
  numberPhone: string;
  personalData: boolean;
}

export interface IPaymentMethod {
  methodName: string;
}

export interface IPaymentFrequency {
  frequencyName: string;
}
export interface IPolicyStatus {
  statusName: string;
}

export interface IPolicy {
  numberPolicy: string;
  coverageAmount: number;
  agencyPercentage: number;
  advisorPercentage: number;
  policyValue: number;
  policyFee?: number;
  numberOfPayments: number;
  startDate: Date;
  endDate: Date;
  paymentsToAdvisor: number;
  paymentsToAgency: number;
  observations?: string;
  renewalPolicy?: boolean;
  renewalCommission: boolean;
}

export interface IAccountType {
  typeName: string;
}
export interface IBankAccount {
  accountNumber: string;
  observations?: string;
}
export interface IPayment {
  number_payment: number;
  value: number;
  pending_value: number;
  credit?: number;
  balance?: number;
  total: number;
  status_payment_id: number;
  observations?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IRenewall {
  renewalNumber: number;
  observations?: string;
  createdAt: Date;
  updatedAt?: Date;
  policyValue?: number;
  agencyPercentage?: number;
  advisorPercentage?: number;
  coverageAmount?: number;
  paymentsToAgency?: number;
  paymentsToAdvisor?: number
  policyFee?: number;
}

export interface IAdvance {
  receiptNumber: string;
  advanceValue: number;
  createdAt: Date;
  observations?: string;
}

export interface ICommissionsPayments {
  receiptNumber: string;
  advanceAmount: number;
  createdAt: Date;
  observations?: string;

}

export interface IStatusAdvance {
  statusNameAdvance: string;
}

export interface ICommissionRefunds {
  amountRefunds: number;
  reason: string;
  cancellationDate: Date;
  createdAt: Date;
  observations?: string;
}
export interface IPolicyPeriodData {
  year: number;
  policyValue: number;
  agencyPercentage: number;
  advisorPercentage: number;
  policyFee: number;
}

export interface ITask{
  
  description: string;  
  statusTask: number;
}