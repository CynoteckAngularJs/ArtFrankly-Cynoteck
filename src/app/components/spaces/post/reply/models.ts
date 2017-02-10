import {Injectable} from 'angular2/core';
import {GenericModel} from '../../../../url/utils/index';
import {
  IProfileEditLD,
  IProfessionalGeneral,
  IInstitutionGeneral,
  IVendorGeneral,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel,
  BaseProfile
} from '../../../profiles/models/profiles';
import {MessageModel, IMessage} from '../messaging/models';
import {ISpacePost} from '../models';

export interface ISpacePostReply {
  '@id'?: string;
  id?: string;
  createdBy?: string;
  about?: string;
  text?: string;
  spacePosting?: string|ISpacePost;
  spaceAttachments?: string[];
  profile?: string;
  replyDate?: Date;
  hiringInstitution?: IInstitutionGeneral;
  hiringVendor?: IVendorGeneral;
  hiringProfessional?: IProfessionalGeneral;
  _message?: MessageModel;
}

let DEFAULTS = {};

export class SpacePostReplyModel extends GenericModel implements ISpacePostReply {
  '@id': string;
  createdBy: string;
  about: string;
  text: string;
  spacePosting: string|ISpacePost;
  spaceAttachments: string[];
  profile: string;
  replyDate: Date;
  hiringInstitution: IInstitutionGeneral;
  hiringVendor: IVendorGeneral;
  hiringProfessional: IProfessionalGeneral;
  _message: MessageModel = new MessageModel();

  constructor(attributes: ISpacePostReply = DEFAULTS) {
    super(attributes);
    return Object.assign(this, attributes);
  }

  get responseProfile(): ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel {
    let profile: IProfessionalGeneral|IInstitutionGeneral|IVendorGeneral = this.hiringInstitution ||
      this.hiringVendor || this.hiringProfessional;
    let ClassType = profile && profile.type && BaseProfile.getClassType(profile.type);
    return new ClassType(profile);
  }

  get responseProfileName() {
    let profile = this.responseProfile;
    return profile && profile.toString();
  }

  get responseSubtitle() {
    let subtitle;
    let profile = this.responseProfile;
    if (profile) {
        subtitle = profile.isProfessional() ?
          profile.profession : profile.industry;
    }
    return subtitle;
  }

  get responseImageSrc(): string {
    let responseProfile = this.hiringInstitution ||
      this.hiringVendor ||
      this.hiringProfessional;
    return responseProfile && responseProfile.image && responseProfile.image.contentUrl;
  }

  // Workaround - make it usable in message aware cmps
  get asMessage(): MessageModel {
    this._message.update({
      created: this.replyDate,
      createdBy: this.createdBy,
      about: this.about,
      text: this.text,
      spaceResponse: this['@id'],
      messageAttachments: this.spaceAttachments,
      profile: this.profile,
      replyDate: this.replyDate,
      hiringInstitution: this.hiringInstitution,
      hiringVendor: this.hiringVendor,
      hiringProfessional: this.hiringProfessional,
      parent: null
    });
    return this._message;
  }
}
