import { Injectable } from 'angular2/core';
import { GenericModel } from '../../../url/utils/index';
import { JobPostReplyModel, IJobPostReply } from './reply/models';
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

export interface IJobPost {
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
  jobLocation?: INamedAddress;
  contactLocation?: INamedAddress;
  jobResponses?: IJobPostReply[];
  deserializedJobResponses?: JobPostReplyModel[];
  profile?: string;
  deserializedProfile?: ProfileProfessionalModel | ProfileInstitutionModel | ProfileVendorModel;
}

let DEFAULTS = { contactLocation: { address: {} }, jobLocation: { address: {} } };
export class JobPostModel extends GenericModel implements IJobPost {
  jobResponses: IJobPostReply[] = [];
  deserializedJobResponses: JobPostReplyModel[] = [];
  state: string;
  hiringProfessional: string;
  hiringVendor: string;
  hiringInstitution: string;
  deserializedProfile: ProfileProfessionalModel | ProfileInstitutionModel | ProfileVendorModel;
  jobLocation: INamedAddress;
  contactLocation: INamedAddress;

  constructor(attributes: IJobPost = DEFAULTS) {
    super(attributes);
    attributes.deserializedJobResponses = this.jobResposesDeserializer(attributes.jobResponses);
    attributes.deserializedProfile = this.getDeserializedProfile(attributes);
    return Object.assign(this, attributes);
  }

  private jobResposesDeserializer(jobResponses: IJobPostReply[] = []): JobPostReplyModel[] {
    return jobResponses.map((jobresponse: IJobPostReply) => new JobPostReplyModel(jobresponse));
  }

  private getDeserializedProfile(
    attrs: IJobPost
  ): ProfileProfessionalModel | ProfileInstitutionModel | ProfileVendorModel {
    let profile = attrs.hiringProfessional || attrs.hiringInstitution || attrs.hiringVendor;
    return BaseProfile.create(profile);
  }
}

@Injectable()
export class JobPostStorage {
  static KEY: string = 'jobpost';

  static get(): any {
    let rawData = localStorage.getItem(JobPostStorage.KEY);
    return JSON.parse(rawData);
  }

  static set(data: any): void {
    if (data) {
      localStorage.setItem(JobPostStorage.KEY, JSON.stringify(data));
    }
  }

  static invalidate(): void {
    localStorage.removeItem(JobPostStorage.KEY);
  }
}
