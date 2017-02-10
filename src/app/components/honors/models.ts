import {IProfileEditLD} from '../profiles/models/profiles';
import {GenericModel, JsonLD} from '../../url/utils/index';

declare var moment: any;

export interface IHonor extends JsonLD {
  id?: string;
  title?: string;
  organization?:	string;
  // DateTime Y-m-d\TH:i:sP
  receiveDate?: Date;
  description?: string;
  url?:	string;
  profile?: string;
}

export const DEFAULT_HONOR = {
  title: '',
  organization:	'',
  // DateTime Y-m-d\TH:i:sP
  receiveDate: new Date()
};

export class HonorModel extends GenericModel implements IHonor {
  title: string = '';
  organization: string =	'';
  // DateTime Y-m-d\TH:i:sP
  receiveDate: Date = new Date();
  profile: string;

  constructor(attributes?: IHonor) {
    super(attributes);
    return Object.assign(this, DEFAULT_HONOR, attributes);
  }

  serialize() {
    let payload = Object.assign({}, this);
    if ((payload.receiveDate || '').trim().length) {
      payload.receiveDate = moment(payload.receiveDate).toDate();
    } else {
      payload.receiveDate = null;
    }
    return payload;
  }
}
