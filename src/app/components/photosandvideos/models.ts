import {IProfileEditLD} from '../profiles/models/profiles';
import {GenericModel, JsonLD} from '../../url/utils/index';

export interface IArtwork extends JsonLD {
  id?: string;
  headline?: string;
  author?:	string;
  datePublished?: Date;
  medium?: string;
  text?: string;
  size?: string;
  mediaObject?:	string;
  profile?: string;
}

export const DEFAULT_ARTWORK = {};

export class ArtworkModel extends GenericModel implements IArtwork {
  constructor(attributes?: IArtwork) {
    super(attributes);
    return Object.assign(this, DEFAULT_ARTWORK, attributes);
  }
}
