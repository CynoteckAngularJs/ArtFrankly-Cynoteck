import {IProfileEditLD} from '../profiles/models/profiles';
import {GenericModel, JsonLD} from '../../url/utils/index';

export interface IArtist extends JsonLD {
  id?: string;
  name?: string;
  description?: string;
  profile?: string;
}

export const DEFAULT_ARTIST = {
  name: '',
  description: ''
};

export class ArtistModel extends GenericModel implements IArtist {
  profile: string;

  constructor(attributes?: IArtist) {
    super(attributes);
    return Object.assign(this, DEFAULT_ARTIST, attributes);
  }
}
