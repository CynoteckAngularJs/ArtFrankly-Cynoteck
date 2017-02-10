import {IProfileEditLD} from '../profiles/models/profiles';
import {GenericModel, JsonLD} from '../../url/utils/index';

export interface IProject extends JsonLD {
  id?: string;
  name?: string;
  company?:	string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  position?:	string;
  profile?: string;
  localId?:string;
}

export const DEFAULT_PROJECT = {
  name: '',
  company:	'',
  startDate: new Date(),
  endDate: new Date()
};

export class ProjectModel extends GenericModel implements IProject {
  profile: string;

  constructor(attributes?: IProject) {
    super(attributes);
    return Object.assign(this, DEFAULT_PROJECT, attributes);
  }
}
