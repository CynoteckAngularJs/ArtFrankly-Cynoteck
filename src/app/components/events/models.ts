import {IProfileEditLD} from '../profiles/models/profiles';
import {
  GenericModel,
  JsonLD,
  IWrappedMedia
} from '../../url/utils/index';

declare var moment: any;

export interface IEvent extends JsonLD {
  id?: string;
  title?: string;
  description?: string;
  endDate?: Date;
  startDate?: Date;
  photo?: string;
  profile?: string;
  photosAndVideos?: IWrappedMedia[];
}

export const DEFAULT_EVENT = {
  title:	'',
  // DateTime Y-m-d\TH:i:sP
  endDate: new Date(),
  startDate: new Date(),
};

export class EventModel extends GenericModel implements IEvent {
  title: string = '';
  // DateTime Y-m-d\TH:i:sP
  endDate: Date = new Date();
  startDate: Date = new Date();
  profile: string;
  photo: string;
  photosAndVideos: IWrappedMedia[] = [];

  constructor(attributes?: IEvent) {
    super(attributes);
    return Object.assign(this, DEFAULT_EVENT, attributes);
  }

  equals(model: EventModel) {
    return this['@id'] === model['@id'] &&
      this['title'] === model['title'] &&
      this['endDate'] === model['endDate'] &&
      this['startDate'] === model['startDate'] &&
      this['profile'] === model['profile'] &&
      this['description'] === model['description'];
  }

  serialize() {
    let payload = Object.assign({}, this);
    delete payload.photosAndVideos;
    delete payload.hiringProfessional;
    delete payload.hiringVendor;
    delete payload.hiringInstitution;
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
