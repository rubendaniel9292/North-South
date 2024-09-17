//interfaces para la entidad CLIENTE
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
  surname: string;
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
  surname: string;
  secondSurname?: string;
  birthdate: Date;
  email: string;
  numberPhone: string;
  personalData: boolean;
}

export interface IPaymentMethod {
  methodName: string;
}

export interface IPayment {
  observations?: string;
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
  observations?: string;
}

export interface IAccountType {
  typeName: string;
}
export interface IBankAccount {
  accountNumber: string;
  observations?: string;
}
