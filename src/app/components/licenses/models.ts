import {IProfileEditLD} from '../profiles/models/profiles';
import {GenericModel, JsonLD} from '../../url/utils/index';

declare var moment: any;

export interface ILicense extends JsonLD {
  id?: string;
  title?: string;
  organization?: string;
  licenseNr?: string;
  certificationUrl?: string;
  validStartDate?: Date;
  endDate?: Date;
  doesntExpire?: boolean;
  profile?: string;
}

export const DEFAULT_LICENSE = {
  title: '',
  organization:	''
};

export class LicenseModel extends GenericModel implements ILicense {
  profile: string;

  constructor(attributes?: ILicense) {
    super(attributes);
    return Object.assign(this, DEFAULT_LICENSE, attributes);
  }

  serialize() {
    let payload = Object.assign({}, this);
    if ((payload.validStartDate || '').trim().length) {
      payload.validStartDate = moment(payload.validStartDate).toDate();
    } else {
      payload.validStartDate = null;
    }
    if ((payload.endDate || '').trim().length) {
      payload.endDate = moment(payload.endDate).toDate();
    } else {
      payload.endDate = null;
    }
    return payload;
  }}
