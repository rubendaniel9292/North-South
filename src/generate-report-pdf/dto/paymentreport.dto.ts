//import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PaymentReportDTO {
  [x: string]: any;

  value: string;

  pending_value: string;

  observations?: string;

  createdAt: string;

  policies: {
    numberPolicy: string;
    policyValue: string;
    customer: {
      numberPhone: string;
      firstName: string;
      secondName: string;
      surname: string;
      secondSurname: string;
    };

    company: {
      companyName: string;
    };

    advisor: {
      firstName: string;
      secondName: string;
      surname: string;
      secondSurname: string;
    };
  };

  paymentStatus: {
    id: string;
    statusNamePayment: string;
  };
}
