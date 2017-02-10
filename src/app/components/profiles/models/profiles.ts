import {FormBuilder, Control, ControlGroup, Validators} from 'angular2/common';
import {Shared} from '../../authentication/shared';
import {SignupModel, defaultSignupModel} from '../../authentication/models/signup';
import {PROFILE_TYPES} from '../../../constants';
import {
  GenericModel,
  Ng2FormDecorator,
  IWrappedMedia,
  WrappedMediaModel,
  IMedia
} from '../../../url/utils/index';
import {UrlValidators} from '../../../url/validators/validators';
import {IArtwork} from '../../artworks/models';
import {INamedAddress, IAddress} from '../../job/post/models';
import {DATE_FORMAT, DATE_TIME_FORMAT} from '../../../config';
import {Utils} from '../../../url/utils/index';

declare var moment: any;

export interface IProfile {
  email: string;
  type: string;
  user: string;
  description?: string;
  telephone?: string;
  url?: string;
}

export interface IProfileEdit {
  firstname?: string;
  lastname?: string;
  profileType: string;
  name?: string;
  email: string;
  password: string;
  telephone?: string;
  description?: string;
  image?: string;
  user?: string;
}

export interface IProfileEditLD {
  '@id'?: string;
  createdBy?: string;
  givenName?: string;
  familyName?: string;
  name?: string;
  email?: string;
  password?: string;
  // TODO: refactor this on server to only have type!
  profileType?: string;
  type?: string;
  telephone?: string;
  description?: string;
  image?: string;
  user?: string;
  url?: string;
  location?: string;
  event?: string;
  artworks?: IArtwork[];
}

export class ProfileEditLDModel extends GenericModel implements IProfileEditLD {
  '@id': string;
  givenName: string;
  familyName: string;
  name: string;
  email: string;
  password: string;
  profileType: string;
  type: string;
  telephone: string;
  description: string;
  image: string;
  user: string;
  location: string;

  static typeOf(iri: string) {
    if (iri.indexOf(PROFILE_TYPES.professional) > -1) {
      return PROFILE_TYPES.professional;
    } else if (iri.indexOf(PROFILE_TYPES.vendor) > -1) {
      return PROFILE_TYPES.vendor;
    } else if (iri.indexOf(PROFILE_TYPES.institution) > -1) {
      return PROFILE_TYPES.institution;
    } else {
      return undefined;
    }
  }

  constructor(attributes: IProfileEditLD = { type: PROFILE_TYPES.professional }) {
    super(attributes);
    return Object.assign(this, attributes);
  }

  isProfessional() {
    return this.type === PROFILE_TYPES.professional;
  }

  isVendor() {
    return this.type === PROFILE_TYPES.vendor;
  }

  isInstitution() {
    return this.type === PROFILE_TYPES.institution;
  }

  toString() {
    return this.isProfessional() ?
      [this.givenName, this.familyName].join(' ') : this.name;
  }
}

export interface IGeneralEditForm {
  email?: string;
  password?: string;
  description?: string;
  telephone?: string;
  image?: string;
  user?: string;
  id?: string;
}

export interface IProfessionalEditForm {
  givenName?: string;
  familyName?: string;
}

export interface INonProfessionalEditForm {
  name?: string;
}

export interface INonProfessionalGeneral {
  type?: string;
  user?: string;
  id?: string;
  name?: string;
  shareContactInfo?: string;
  email?: string;
  image?: IMedia;
  industry?: any;
  hoursOfOperation?: string;
  yearEstablished?: string;
  createdBy?: string;
  description?: string;
  telephone?: string;
  url?: string;
  languages?: string;
  skills?: string;
  specialities?: string;
  period?: string;
  photosAndVideos?: IWrappedMedia[];
  artworks?: IArtwork[];
  location?: INamedAddress;
  industryArray?: string[];
}

export interface IInstitutionGeneral extends INonProfessionalGeneral {
  period?: string;
}

export interface IVendorGeneral extends INonProfessionalGeneral {
  availability?: string;
  specialities?: string;
}

export interface IProfessionalGeneral {
  type?: string;
  user?: string;
  id?: string;
  givenName?: string;
  familyName?: string;
  birthDate?: Date;
  shareContactInfo?: string;
  email?: string;
  image?: IMedia;
  telephone?: string;
  url?: string;
  availability?: string;
  profession?: any;
  languages?: string;
  skills?: string;
  specialities?: string;
  period?: string;
  photosAndVideos?: IWrappedMedia[];
  artworks?: IArtwork[];
  location?: INamedAddress;
  professionArray?: string[];
}

export interface IEditForm {
  profileType?: string;
  general?: IGeneralEditForm;
  professional?: IProfessionalEditForm;
  nonProfessional?: INonProfessionalEditForm;
}

export class ProfileEditModel {
  constructor(public model: IProfileEditLD = {}) {}

  serialize(profile: IProfileEditLD = this.model): IProfileEditLD {
    return Object.assign({}, profile);
  }

  deserialize() {}
}


export const DEFAULTS = {
    email: undefined,
    type: 'professional',
    user: undefined,
    description: undefined,
    telephone: undefined,
    url: undefined,
};

export class ProfileModel {
  constructor(public profile?: IProfile) {
    this.profile = Object.assign({}, profile, DEFAULTS);
  }
}

interface IBaseProfile {
  type?: string;
  givenName?: string;
  familyName?: string;
  name?: string;
  user?: string;
}

export class BaseProfile extends GenericModel {
  user: string;
  type: string;
  email: string;
  givenName: string;
  familyName: string;
  name: string;
  image: IMedia;
  languages: string;
  skills: string;
  specialities: string;
  period: string;
  artworks: IArtwork[];
  profession: any;
  industry: any;

  static getClassType(type: string): any {
    if (PROFILE_TYPES.professional === type) {
      return ProfileProfessionalModel;
    } else if (PROFILE_TYPES.vendor === type) {
      return ProfileVendorModel;
    } else if (PROFILE_TYPES.institution === type) {
      return ProfileInstitutionModel;
    } else {
      return undefined;
    }
  }

  static create(profile: IBaseProfile = { type: PROFILE_TYPES.professional }) {
    let instance;
    let classType = BaseProfile.getClassType(profile.type || PROFILE_TYPES.professional);
    if (classType) {
      instance = new classType(profile);
    }
    return instance;
  }

  constructor(attributes: IBaseProfile) {
    super(attributes);
    Object.assign(this, attributes);
  }

  isProfessional() {
    return this.type === PROFILE_TYPES.professional;
  }

  isVendor() {
    return this.type === PROFILE_TYPES.vendor;
  }

  isInstitution() {
    return this.type === PROFILE_TYPES.institution;
  }

  hasFullAddress() {
    return this.type === PROFILE_TYPES.vendor || this.type === PROFILE_TYPES.institution;
  }

  isTypeAllowed() {
    return this.isInstitution() || this.isVendor() || this.isProfessional();
  }

  getRouterLink() {
    return ['./ProfilePreview', { type: this.type, id: this.id}];
  }

  getMyProfileQuery() {
    let propertyName: string;
    if (this.isProfessional()) {
      propertyName = 'hiringProfessional';
    } else if (this.isVendor()) {
      propertyName = 'hiringVendor';
    } else if (this.isInstitution()) {
      propertyName = 'hiringInstitution';
    }
    return {
      type: propertyName,
      value: this['@id']
    };
  }

  toString() {
    return this.isProfessional() ?
      [this.givenName, this.familyName].join(' ') : this.name;
  }

  convertPhotoAndVideo(photoAndVideo: IWrappedMedia) {
    return new WrappedMediaModel(photoAndVideo);
  }

  convertPhotosAndVideos(photosAndVideos: IWrappedMedia[] = []) {
    return photosAndVideos.map(this.convertPhotoAndVideo);
  }

  get languagesArray() {
    return (this.languages || '').split(',');
  }

  get skillsArray() {
    return (this.skills || '').split(',');
  }

  get specialitiesArray() {
    return (this.specialities || '').split(',');
  }

  get professionArray() {
    return (this.profession || '').split(',');
  }

  get industryArray() {
    return (this.industry || '').split(',');
  }

  get periodArray() {
    return (this.period || '').split(',');
  }

  serialize() {
    let payload = Object.assign({}, this);
    delete payload.photosAndVideos;
    delete payload.image;
    delete payload.artworks;
    return payload;
  }
}

const DEFAULT_LOCATION = { address: {} };

export class ProfileProfessionalModel extends BaseProfile implements IProfessionalGeneral {
  type: string = PROFILE_TYPES.professional;
  photosAndVideos: IWrappedMedia[] = [];
  location: INamedAddress = { address: {} };

  constructor(attributes: IProfessionalGeneral = { type: PROFILE_TYPES.professional }) {
    super(attributes);
    Object.assign(this, attributes);
    if (!this.location || (this.location && !this.location.address)) {
      this.location = Object.assign({}, DEFAULT_LOCATION);
    }
    if (this.photosAndVideos.length) {
      this.photosAndVideos = this.convertPhotosAndVideos([...this.photosAndVideos]);
    }
    return this;
  }
}

export class ProfileProfessionalModelForm extends Ng2FormDecorator {
  constructor(builder: FormBuilder, model: IProfessionalGeneral = new ProfileProfessionalModel()) {
    super(builder, model);
  }

  initForm(model: IProfessionalGeneral): ControlGroup {
    return this.builder.group({
      '@id': [model['@id']],
      user: [model.user, Validators.required],
      type: [model.type, Validators.required],
      givenName: [model.givenName, Validators.required],
      familyName: [model.familyName, Validators.required],
      birthDate: [
        moment((model && model.birthDate) || '').isValid() ?
          Utils.format(model && model.birthDate, DATE_FORMAT) : null,
        UrlValidators.date
      ],
      shareContactInfo: [model.shareContactInfo],
      email: [model.email, Shared.getEmailValidators()],
      telephone: [model.telephone, UrlValidators.phone],
      url: [model.url || '', UrlValidators.url],
      availability: [model.availability],
      // profession: [model.profession, Validators.required],
      profession: [model.professionArray || '', Validators.required],
      location: this.builder.group({
        '@id': [model.location['@id']],
        '@type': ['http://schema.org/Place'],
        name: [model.location.name],
        address: this.builder.group({
          '@id': [model.location.address['@id']],
          '@type': ['http://schema.org/PostalAddress'],
          addressCountry: [model.location.address.addressCountry],
          addressLocality: [model.location.address.addressLocality],
          addressRegion: [model.location.address.addressRegion],
          postalCode: [model.location.address.postalCode],
          postOfficeBoxNumber: [model.location.address.postOfficeBoxNumber],
          streetAddress: [model.location.address.streetAddress],
          telephone: [model.location.address.telephone],
          apartment: [model.location.address.apartment],
          city: [model.location.address.city],
        })
      })
    });
  }

  updateForm(model: any = {}, ctrlUpdateOpts?: any) {
    super.updateForm(model, ctrlUpdateOpts);
    (<Control> this.form.controls['birthDate'])
      .updateValue(
          moment(model['birthDate']).isValid() ?
            Utils.format(model['birthDate'], DATE_FORMAT) : null, ctrlUpdateOpts);
    (<Control> this.form.controls['profession'])
      .updateValue(model.professionArray, ctrlUpdateOpts);
  }
}

export class ProfileInstitutionModel extends BaseProfile implements IInstitutionGeneral {
  type: string = PROFILE_TYPES.institution;
  photosAndVideos: IWrappedMedia[] = [];
  location: INamedAddress = { address: {} };

  constructor(attributes: IInstitutionGeneral = { type: PROFILE_TYPES.institution }) {
    super(attributes);
    Object.assign(this, attributes);
    if (!this.location || (this.location && !this.location.address)) {
      this.location = Object.assign({}, DEFAULT_LOCATION);
    }
    if (this.photosAndVideos.length) {
      this.photosAndVideos = this.convertPhotosAndVideos([...this.photosAndVideos]);
    }
    return this;
  }
}

export class ProfileInstitutionModelForm extends Ng2FormDecorator {
  constructor(builder: FormBuilder, model: IInstitutionGeneral) {
    super(builder, model);
  }

  initForm(model: IInstitutionGeneral): ControlGroup {
    return this.builder.group({
      '@id': [model['@id']],
      user: [model.user, Validators.required],
      type: [model.type, Validators.required],
      name: [model.name, Validators.required],
      shareContactInfo: [model.shareContactInfo],
      email: [model.email, Shared.getEmailValidators()],
      telephone: [model.telephone, UrlValidators.phone],
      url: [model.url || '', UrlValidators.url],
      // industry: [model.industry],
      industry: [model.industryArray || ''],
      hoursOfOperation: [model.hoursOfOperation],
      yearEstablished: [model.yearEstablished],
      location: this.builder.group({
        '@id': [model.location['@id']],
        '@type': ['http://schema.org/Place'],
        name: [model.location.name],
        address: this.builder.group({
          '@id': [model.location.address['@id']],
          '@type': ['http://schema.org/PostalAddress'],
          addressCountry: [model.location.address.addressCountry],
          addressLocality: [model.location.address.addressLocality],
          addressRegion: [model.location.address.addressRegion],
          postalCode: [model.location.address.postalCode],
          postOfficeBoxNumber: [model.location.address.postOfficeBoxNumber],
          streetAddress: [model.location.address.streetAddress],
          telephone: [model.location.address.telephone],
          apartment: [model.location.address.apartment],
          city: [model.location.address.city],
        })
      })
    });
  }

  updateForm(model: any = {}, ctrlUpdateOpts?: any) {
    super.updateForm(model, ctrlUpdateOpts);
    (<Control> this.form.controls['industry'])
      .updateValue(model.industryArray, ctrlUpdateOpts);
  }
}

export class ProfileVendorModel extends BaseProfile implements IVendorGeneral {
  type: string = PROFILE_TYPES.vendor;
  photosAndVideos: IWrappedMedia[] = [];
  location: INamedAddress = { address: {} };

  constructor(attributes: IVendorGeneral = { type: PROFILE_TYPES.vendor }) {
    super(attributes);
    Object.assign(this, attributes);
    if (!this.location || (this.location && !this.location.address)) {
      this.location = Object.assign({}, DEFAULT_LOCATION);
    }
    if (this.photosAndVideos.length) {
      this.photosAndVideos = this.convertPhotosAndVideos([...this.photosAndVideos]);
    }
    return this;
  }
}

export class ProfileVendorModelForm extends Ng2FormDecorator {
  constructor(builder: FormBuilder, model: IVendorGeneral) {
    super(builder, model);
  }

  initForm(model: IVendorGeneral): ControlGroup {
    return this.builder.group({
      '@id': [model['@id']],
      user: [model.user, Validators.required],
      type: [model.type, Validators.required],
      name: [model.name, Validators.required],
      shareContactInfo: [model.shareContactInfo],
      email: [model.email, Shared.getEmailValidators()],
      telephone: [model.telephone, UrlValidators.phone],
      url: [model.url || '', UrlValidators.url],
      // industry: [model.industry],
      industry: [model.industryArray || ''],
      availability: [model.availability],
      hoursOfOperation: [model.hoursOfOperation],
      yearEstablished: [model.yearEstablished],
      specialities: [model.specialities],
      location: this.builder.group({
        '@id': [model.location['@id']],
        '@type': ['http://schema.org/Place'],
        name: [model.location.name],
        address: this.builder.group({
          '@id': [model.location.address['@id']],
          '@type': ['http://schema.org/PostalAddress'],
          addressCountry: [model.location.address.addressCountry],
          addressLocality: [model.location.address.addressLocality],
          addressRegion: [model.location.address.addressRegion],
          postalCode: [model.location.address.postalCode],
          postOfficeBoxNumber: [model.location.address.postOfficeBoxNumber],
          streetAddress: [model.location.address.streetAddress],
          telephone: [model.location.address.telephone],
          apartment: [model.location.address.apartment],
          city: [model.location.address.city],
        })
      })
    });
  }

  updateForm(model: any = {}, ctrlUpdateOpts?: any) {
    super.updateForm(model, ctrlUpdateOpts);
    (<Control> this.form.controls['industry'])
      .updateValue(model.industryArray, ctrlUpdateOpts);
  }
}
