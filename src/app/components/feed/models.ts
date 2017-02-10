import {FEED_TYPES, PROFILE_TYPES} from '../../constants';
import {JobPostModel, IJobPost} from '../job/post/models';
import {SpacePostModel, ISpacePost} from '../spaces/post/models';
import {Utils} from '../../url/utils/index';

export interface IFeedFilter {
  type?: string;
  'order[dateModified]'?: string;
  description?: string;
  term?: string;
}

export interface IFeed {
  id?: string;
  routerLink?: any[];
  '@id'?: string;
  description?:	string;
  image?:	string;
  name?: string;
  url?:	string;
  featured?: boolean;
  dateCreated?:	Date;
  dateModified?: Date;
  type?: string;
  itemRef?:	string;
  location?: string;
  paymentDate?:	Date;
  visibleToDate?:	Date;
  createdBy?: string;
}

let DEFAULTS = {};

export class FeedModel implements IFeed {
  type: string;
  itemRef: string;
  name: string;
  image: string;
  description:	string;
  createdBy: string;

  static extractId(iriString: string = '') {
    return Utils.extractIdFromIRI(iriString);
  }

  constructor(attributes: IFeed = DEFAULTS) {
    return Object.assign(this, attributes);
  }

  get isProfile(): boolean {
    return this.type === FEED_TYPES.profile;
  }

  get isJobPost(): boolean {
    return this.type === FEED_TYPES.job_posting;
  }

  get isSpacePost(): boolean {
    return this.type === FEED_TYPES.space_posting;
  }

  get createdById(): string {
    return Utils.extractIdFromIRI(this.createdBy);
  }

  get routerLink(): any[] {
    // TODO: 404 page by default
    let routerLink: any[] = ['Home'];
    switch (this.type) {
      case FEED_TYPES.profile:
        // routerLink = ['Profile', { '@id': this['itemRef'] }];
        let itemSegments = this['itemRef'].split('/');
        let type;
        if (itemSegments[1] === 'professionals') {
          type = PROFILE_TYPES.professional;
        } else if (itemSegments[1] === 'vendors') {
          type = PROFILE_TYPES.vendor;
        } else if (itemSegments[1] === 'institutions') {
          type = PROFILE_TYPES.institution;
        }
        routerLink = ['ProfilePreview', {
          id: itemSegments[2],
          type: type
        }];
        break;
      case FEED_TYPES.job_posting:
        routerLink = ['JobPost', { 'id': this.id }];
        break;
      case FEED_TYPES.space_posting:
        routerLink = ['SpacePost', { 'id': this.id }];
        break;
      default:
        routerLink = ['JobPost', { 'id': this.id }];
        break;
    }
    return routerLink;
  }

  getRuterLink(): any[] {
    // TODO: 404 page by default
    let routerLink: any[] = ['Home'];
    switch (this.type) {
      case FEED_TYPES.profile:
        // routerLink = ['Profile', { '@id': this['itemRef'] }];
        let itemSegments = this['itemRef'].split('/');
        let type;
        if (itemSegments[1] === 'professionals') {
          type = PROFILE_TYPES.professional;
        } else if (itemSegments[1] === 'vendors') {
          type = PROFILE_TYPES.vendor;
        } else if (itemSegments[1] === 'institutions') {
          type = PROFILE_TYPES.institution;
        }
        routerLink = ['ProfilePreview', {
          id: itemSegments[2],
          type: type
        }];
        break;
      case FEED_TYPES.job_posting:
        routerLink = ['JobPost', { 'id': this.id }];
        break;
      default:
        routerLink = ['JobPost', { 'id': this.id }];
        break;
    }
    return routerLink;
  }

  isProfessional(): boolean {
    return this.type === FEED_TYPES.profile && this['itemRef'].startsWith('/professionals/');
  }

  isVendor(): boolean {
    return this.type === FEED_TYPES.profile && this['itemRef'].startsWith('/vendors/');
  }

  isInstitution(): boolean {
    return this.type === FEED_TYPES.profile && this['itemRef'].startsWith('/institutions/');
  }

  toJobPost(): JobPostModel {
    let jobpost: JobPostModel;
    if (this.isJobPost) {
      jobpost = new JobPostModel({
        '@id': this.itemRef,
        title: this.name,
        description: this.description,
        image: this.image
      });
    }
    return jobpost;
  }

   toSpacePost(): SpacePostModel {
    let spacepost: SpacePostModel;
    if (this.isSpacePost) {
      spacepost = new SpacePostModel({
        '@id': this.itemRef,
        title: this.name,
        description: this.description,
        image: this.image
      });
    }
    return spacepost;
  }

  get id(): string {
    return FeedModel.extractId(this['itemRef']);
  }
}
