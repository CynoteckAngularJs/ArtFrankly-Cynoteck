import { Injectable } from 'angular2/core';
import { GenericModel, IWrappedMedia, WrappedMediaModel } from '../../../url/utils/index';
import { SpacePostReplyModel, ISpacePostReply } from './reply/models';
import {
  ProfileProfessionalModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  IInstitutionGeneral,
  IVendorGeneral,
  IProfessionalGeneral,
  BaseProfile
} from '../../profiles/models/profiles';

export interface IAddress {
  id?: string;
  '@type'?: string;
  addressCountry?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  postOfficeBoxNumber?: string;
  streetAddress?: string;
  telephone?: string;
  apartment?: string;
  city?: string;
}

export interface INamedAddress {
  id?: string;
  '@type'?: string;
  name?: string;
  address?: IAddress;
}

export interface ISpacePost {
  '@id'?: string;
  id?: string;
  datePosted?: Date;
  datePostedWords?: Date;
  description?: string;
  title?: string;
  contactemail?: string;
  additional?: string;
  contactname?: string;
  contactphone?: string;
  favorite?: boolean;
  position?: string;
  industry?: string;
  hiringProfessional?: IProfessionalGeneral;
  hiringVendor?: IVendorGeneral;
  hiringInstitution?: IInstitutionGeneral;
  archived?: boolean;
  organization?: string;
  url?: string;
  image?: string;
  state?: string;
  spaceLocation?: INamedAddress;
  contactLocation?: INamedAddress;
  spaceResponses?: ISpacePostReply[];
  deserializedSpaceResponses?: SpacePostReplyModel[];
  profile?: string;
  deserializedProfile?: ProfileProfessionalModel | ProfileInstitutionModel | ProfileVendorModel;
  size?: string;
  pricing?: string;
  spacephotos?: string;
  photosAndVideos?: IWrappedMedia[];
}

let DEFAULTS = { contactLocation: { address: {} }, spaceLocation: { address: {} } };
export class SpacePostModel extends GenericModel implements ISpacePost {
  spaceResponses: ISpacePostReply[] = [];
  deserializedSpaceResponses: SpacePostReplyModel[] = [];
  state: string;
  hiringProfessional: string;
  hiringVendor: string;
  hiringInstitution: string;
  deserializedProfile: ProfileProfessionalModel | ProfileInstitutionModel | ProfileVendorModel;
  spaceLocation: INamedAddress;
  contactLocation: INamedAddress;
  photosAndVideos: IWrappedMedia[] = [];

  constructor(attributes: ISpacePost = DEFAULTS) {
    super(attributes);
    attributes.deserializedSpaceResponses = this.spaceResposesDeserializer
      (attributes.spaceResponses);
    attributes.deserializedProfile = this.getDeserializedProfile(attributes);
    Object.assign(this, attributes);
    if (this.photosAndVideos.length) {
      this.photosAndVideos = this.convertPhotosAndVideos([...this.photosAndVideos]);
    }
    return this;
  }

  convertPhotoAndVideo(photoAndVideo: IWrappedMedia) {
    return new WrappedMediaModel(photoAndVideo);
  }

  convertPhotosAndVideos(photosAndVideos: IWrappedMedia[] = []) {
    return photosAndVideos.map(this.convertPhotoAndVideo);
  }

  private spaceResposesDeserializer(spaceResponses: ISpacePostReply[] = []): SpacePostReplyModel[] {
    return spaceResponses.map
      ((spaceresponse: ISpacePostReply) => new SpacePostReplyModel(spaceresponse));
  }

  private getDeserializedProfile(
    attrs: ISpacePost
  ): ProfileProfessionalModel | ProfileInstitutionModel | ProfileVendorModel {
    if (!attrs.photosAndVideos)
      delete attrs.photosAndVideos;
    let profile = attrs.hiringProfessional || attrs.hiringInstitution || attrs.hiringVendor;
    return BaseProfile.create(profile);
  }
}

@Injectable()
export class SpacePostStorage {
  static KEY: string = 'spacepost';
  static FEATURED_IMAGE_KEY: string = 'spaceFeaturedImages';
  static ADDITIONAL_IMAGE_KEY: string = 'spaceAdditionalImages';

  static get(): any {
    let rawData = localStorage.getItem(SpacePostStorage.KEY);
    return JSON.parse(rawData);
  }

  static set(data: any): void {
    if (data) {
      localStorage.setItem(SpacePostStorage.KEY, JSON.stringify(data));
    }
  }

  static invalidate(): void {
    localStorage.removeItem(SpacePostStorage.KEY);
  }
}
