import {IUpload, GenericModel} from '../../../../url/utils/index';
import {
  IProfessionalGeneral,
  IInstitutionGeneral,
  IVendorGeneral,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel,
  BaseProfile
} from '../../../profiles/models/profiles';

export interface IMessage {
  created?: Date;
  createdBy?: string;
  about?: string;
  text?: string;
  jobResponse?: string;
  messageAttachments?: IUpload[];
  parent?: IMessage;
  profile?: string;
  hiringInstitution?: IInstitutionGeneral;
  hiringVendor?: IVendorGeneral;
  hiringProfessional?: IProfessionalGeneral;
}

export class MessageModel extends GenericModel implements IMessage {
  text: string;
  parent: IMessage;
  hiringInstitution: IInstitutionGeneral;
  hiringVendor: IVendorGeneral;
  hiringProfessional: IProfessionalGeneral;

  constructor(attributes: IMessage = {}) {
    super(attributes);
    Object.assign(this, attributes);
    attributes.parent = this.deserialize(attributes.parent);
    return this;
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

  private deserialize(message: IMessage): MessageModel {
    if (message) {
      let msg = new MessageModel(message);
      return msg.parent ? this.deserialize(msg.parent) : msg;
    }
  }
}
