import {IProfileEditLD} from '../profiles/models/profiles';
import {GenericModel, JsonLD} from '../../url/utils/index';

export interface IEducation extends JsonLD {
  id?: string;
  createdBy?: string;
  location?: string;
  school?: string;
  degree?: string;
  areaOfFocus?: string;
  // DateTime Y-m-d\TH:i:sP
  startDate?: Date;
  // DateTime Y-m-d\TH:i:sP
  endDate?: Date;
  profile?: string;
  present?: boolean;
}

export const DEFAULT_EDUCATION = {
  // DateTime Y-m-d\TH:i:sP
  endDate: new Date(),
  startDate: new Date(),
  present: false
};

export class EducationModel extends GenericModel implements IEducation {
  profile: string;
  present: boolean;

  constructor(attributes?: IEducation) {
    super(attributes);
    return Object.assign(this, DEFAULT_EDUCATION, attributes);
  }
}
