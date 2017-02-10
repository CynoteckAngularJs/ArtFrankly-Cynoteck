import {IProfileEditLD} from '../profiles/models/profiles';
import {GenericModel, JsonLD, IMedia} from '../../url/utils/index';

declare var moment: any;

export interface IArtwork extends JsonLD {
  id?: string;
  headline?: string;
  author?:	string;
  datePublished?: Date;
  medium?: string;
  text?: string;
  size?: string;
  mediaObject?:	IMedia;
  profile?: string;
  mode?: string;
}

export const DEFAULT_ARTWORK = {};

export class ArtworkModel extends GenericModel implements IArtwork {
  profile: string;
  mediaObject:	IMedia;
  mode: string;
  constructor(attributes?: IArtwork) {
    super(attributes);
    return Object.assign(this, DEFAULT_ARTWORK, attributes);
  }

  serialize() {
    let payload = Object.assign({}, this);
    delete payload.mediaObject;
    delete payload.mode;
    if ((payload.datePublished || '').trim().length) {
      payload.datePublished = moment(payload.datePublished).toDate();
    } else {
      payload.datePublished = null;
    }
    return payload;
  }
}
