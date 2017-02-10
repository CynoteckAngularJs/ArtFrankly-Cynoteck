import {IProfileEditLD} from '../profiles/models/profiles';
import {GenericModel, JsonLD} from '../../url/utils/index';

declare var moment: any;

export interface IExperience extends JsonLD {
  id?: string;
  title?: string;
  description?: string;
  company?:	string;
  startDate?: Date;
  endDate?: Date;
  location?:	string;
  profile?: string;
  present?: boolean;
}

export const DEFAULT_EXPERIENCE = {
  title: '',
  company:	'',
  startDate: new Date(),
  endDate: new Date(),
  present: false
};

export class ExperienceModel extends GenericModel implements IExperience {
  profile: string;
  present: boolean;

  constructor(attributes?: IExperience) {
    super(attributes);
    return Object.assign(this, DEFAULT_EXPERIENCE, attributes);
  }

  serialize() {
    let payload = Object.assign({}, this);
    if ((payload.startDate || '').trim().length) {
      payload.startDate = moment(payload.startDate).toDate();
    } else {
      payload.startDate = null;
    }
    if ((payload.endDate || '').trim().length) {
      payload.endDate = moment(payload.endDate).toDate();
    } else {
      payload.endDate = null;
    }
    return payload;
  }
}
