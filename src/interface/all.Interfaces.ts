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
  secondName: string;
  //status_id: number;
  surname: string;
  secondSurname: string;
  birthdate: Date;
  email: string;
  numberPhone: string;
  //province_id: number;
  //city_id: number;
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
  firstName: string;
  secondName: string;
  surname: string;
  secondSurname: string;
  email: string;
  numberPhone: string;
  personalData: boolean;
}

export interface IPaymentMethod {
  methodName: string;
}

export interface IPayment {
  observations: string;
}

export interface IPaymentFrequency {
  frequencyName: string;
}
export interface IPolicyStatus {
  statusName: string;
}

export interface IPolicy {
  numberPolicy: string; // VARCHAR(50) NOT NULL UNIQUE
  coverageAmount: number; // DECIMAL(10, 2) NOT NULL
  agencyPercentage: number; // DECIMAL(5, 2) NOT NULL
  advisorPercentage: number; // DECIMAL(5, 2) NOT NULL
  policyValue: number; // DECIMAL(10, 2) NOT NULL
  numberOfPayments: number; // INT NOT NULL
  startDate: Date; // DATE NOT NULL
  endDate: Date; // DATE NOT NULL
  paymentsToAdvisor: number; // DECIMAL(10, 2) NOT NULL
}
