import {GenericModel} from '../../url/utils/index';

export interface IPaypal {
  PayerID?: string;
  paymentId?: string;
  token?: string;
}

export interface IPayment {
  '@id'?: string;
  '@type'?: string;
  createdBy?: string;
  updatedBy?: string;
  created?: Date;
  updated?: Date;
  paymentDate?: Date;
  paymentAmount?: string;
  approvalUrl?: string;
  paymentId?: string;
  paymentToken?: string;
  payerId?: string;
  executeUrl?: string;
  jobPosting?: string;
}

export class PaypalModel implements IPaypal {
  constructor(attributes?: IPaypal) {
    return Object.assign(this, {}, attributes);
  }
}

export class PaymentModel extends GenericModel implements IPayment {
  jobPosting: string;
  constructor(attributes?: IPayment) {
    super(attributes);
    return Object.assign(this, {}, attributes);
  }
}
