import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild
} from 'angular2/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import {
  ROUTER_DIRECTIVES,
  Router,
  RouteParams,
  CanActivate
} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  JsonPipe,
  AsyncPipe
} from 'angular2/common';
import {
  IProfile,
  ProfileModel,
  IProfileEdit,
  ProfileEditModel,
  IProfileEditLD,
  ProfileEditLDModel,
  IEditForm,
  BaseProfile,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel
} from '../models/profiles';
import { ProfilesService } from '../services/profiles-service';
import { ProfileIdService } from '../../projects/services/projects-service';
import { Shared, SigninFormControlls } from '../../authentication/shared';
import {
  PROFILE_TYPES,
  PROFILES,
  ROUTES,
  NOTIFICATION_TAGS,
  PROFILE_SUBMODEL_TYPES,
  UPLOADER
} from '../../../constants';
import { API } from '../../../config';
import { NotificationsCollection } from '../../notifications/services/notifications';
import { NotificationModel } from '../../notifications/notification/notification';
import { checkIfHasPermission } from '../../authentication/services/token-manager-service';
import { AppService, IApp, DEFAULTS, ACTIONS } from '../../authentication/services/app-service';
import { Utils } from '../../../url/utils/index';
import { Select2 } from '../../select/select';
import { Ng2Select2 } from '../../../url/components/ng2select2/select2';
import { FormList } from '../../formlist/list/list';
import { SubmodelForms } from '../submodels/submodels';
import { InstitutionForm } from './institution/form';
import { ProfessionalForm } from './professional/form';
import { VendorForm } from './vendor/form';
import { AFUploader } from '../../af-uploader/af-uploader';
import { UPLOAD_DIRECTIVES } from '../../../url/components/ng2-uploader/ng2-uploader';

declare var jQuery: any;

@Component({
  selector: 'profile',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...UPLOAD_DIRECTIVES,
    NgClass,
    Select2,
    Ng2Select2,
    FormList,
    SubmodelForms,
    InstitutionForm,
    ProfessionalForm,
    VendorForm,
    AFUploader
  ],
  providers: [ProfilesService],
  pipes: [AsyncPipe, JsonPipe],
  styles: [require('./editprofile.css')],
  template: require('./editprofile.html')
})
@CanActivate(checkIfHasPermission)
export class EditProfile implements OnInit {
  @Output() deleted: EventEmitter<any> = new EventEmitter();
  /* tslint:disable */
  @Input() profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel = new ProfileProfessionalModel();
  /* tslint:enable */

  profiles: any = PROFILES || [];
  profileTypes: any = PROFILE_TYPES;
  selectedProfile: string = PROFILE_TYPES.professional;
  form: ControlGroup;
  generalGroup: ControlGroup;
  nonProfessionalGroup: ControlGroup;
  professionalGroup: ControlGroup;
  profileType: Control;
  email: Control;
  givenName: Control;
  familyName: Control;
  name: Control;
  description: Control;
  image: Control;
  telephone: Control;
  user: Control;
  id: Control;
  state: IApp = DEFAULTS;;
  state$: Subscription<[any]>;
  myState: IApp = DEFAULTS;
  profileId: string = '';
  formInvalid$: Observable<boolean>;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  myProfiles$: Observable<(ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel)[]>;
  myProfiles: (ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel)[] = [];
  profileModel: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel;
  PROFILE_SUBMODEL_TYPES: any = PROFILE_SUBMODEL_TYPES;
  UPLOADER: any = UPLOADER;
  @ViewChild(AFUploader) afUploader;
  profileTypeSelect2Options: any = {
    minimumResultsForSearch: -1
  };

  constructor(
    private builder: FormBuilder,
    private router: Router,
    private routeParams: RouteParams,
    private profileService: ProfilesService,
    public ProfileIdService: ProfileIdService,
    private notificationsSvc: NotificationsCollection,
    public appSrv: AppService
  ) {

    let profileDisposable = this.appSrv.$stream
      .filter((state) => state.action === ACTIONS.PROFILE_SELECTED)
      .map((state) => state.selectedProfile)
      .subscribe((profile) => {
        this.profile = profile;
      });

    this.initForm();

    this.myProfiles$ = this.appSrv.$stream
      // .filter((state) => state.action === ACTIONS.MY_PROFILE_SET)
      .map((state) => state.myProfiles);

    let userDisposable = this.myProfiles$
      .map((myProfiles) => myProfiles.length && myProfiles[0].user)
      .subscribe((user) => {
        this.user.updateValue(user, this.controlUpdateOptions);
        this.profile.user = user;
        // this.onProfileTypeChange(this.profileModel && this.profileModel.type);
      });

    let myProfilesDisposable = this.myProfiles$
      .subscribe(
      (myProfiles) => {
        this.myProfiles = myProfiles;
      }
      );
    this.appSrv.$stream
      .subscribe((state) => {
        this.myState = state;
        if (state.selectedProfile) {
          this.profileId = this.myState.selectedProfile['@id'];
        }
      });
  }

  ngOnInit() {
    this.getProfile();
  }

  // select2 related - propagate selected value to the control!
  updateControlValue(control: Control, value) {
    control.markAsDirty();
    control.updateValue(value, this.controlUpdateOptions);
  }

  getProfileValue(profile: IProfileEditLD = {}): IProfileEditLD {
    return Object.assign({ type: PROFILE_TYPES.professional }, profile);
  }

  setProfileFormValues(
    profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel
  ) {
    // let p = Object.assign(new ProfileEditLDModel({ type: PROFILE_TYPES.professional }), profile);
    this.profileType.updateValue(profile.type, this.controlUpdateOptions);
    this.image.updateValue(profile.image, this.controlUpdateOptions);
    this.user.updateValue(profile.user, this.controlUpdateOptions);
  }

  initForm() {
    let profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel = this.profile;
    this.profileType = new Control(profile.type, Validators.required);
    this.image = new Control(profile.image);
    this.user = new Control(profile.user);
    this.generalGroup = new ControlGroup({
      image: this.image,
      user: this.user,
    });
    this.form = this.builder.group({
      profileType: this.profileType,
      general: this.generalGroup,
    });
  }

  isRoute(linkParams: any[]): boolean {
    return this.router.parent.isRouteActive(this.router.generate(linkParams));
  }

  isAddProfile() {
    let addProfileUrl = this.router.generate(['/AddProfile']).urlPath;
    return window.location.href.toString().indexOf(addProfileUrl) > -1 ? true : false;
    //return window.location.hash.slice(2).startsWith(addProfileUrl);
    // return this.isRoute(['/AddProfile']);
  }

  getProfile() {
    let isAddProfile = this.isAddProfile();
    let requestedProfileType = this.routeParams.get('profileType');
    if (isAddProfile) {
      // this.profile = new ProfileEditLDModel({ user: this.user.value });
      this.profile = BaseProfile.create({
        type: requestedProfileType || PROFILE_TYPES.professional,
        user: this.user.value
      });
      this.setProfileFormValues(this.profile);
      // this.profileModel = TODO: create default type
      this.profileModel = BaseProfile.create({
        // type: PROFILE_TYPES.professional,
        type: requestedProfileType || PROFILE_TYPES.professional,
        user: this.user.value
      });
      this.onProfileTypeChange(this.profileModel.type);
    } else {
      let resourcePath = '/' + this.routeParams.get('type') + '/' + this.routeParams.get('uId');
      this.profileService.get(resourcePath).subscribe(
        (response: IProfileEditLD) => {
          this.profile = BaseProfile.create(response);
          this.profileModel = BaseProfile.create(response);
          this.onProfileTypeChange(this.profileModel.type);
          this.setProfileFormValues(this.profile);
        },
        (error) => {
          console.log('ERROR ', error);
        }
      );
    }
  }

  updateMyProfilesStore(
    profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel
  ) {
    let myProfiles = [...this.myProfiles];
    // TODO: Validate if profile is valid!
    if (this.isAddProfile()) {
      myProfiles.push(profile);
    } else {
      myProfiles = myProfiles.map((
        myProfile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel
      ) => {
        return profile['@id'] === myProfile['@id'] ? profile : myProfile;
      });
    }
    this.appSrv.setMyProfiles(myProfiles);
  }

  onSaveError($event: any) {
    this.notificationsSvc.push(new NotificationModel({
      message: `Error has occured while saving the profile!`,
      type: 'danger'
    }));
    Utils.scrollTop();
  }

  onSaveSuccess(savedProfile: {
    current: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel,
    previous: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel
  }) {
    let profile = savedProfile.current;
    let previousProfile = savedProfile.previous;
    this.updateMyProfilesStore(profile);
    this.profileModel.update(profile);
    this.notificationsSvc.push(new NotificationModel({
      message: `Profile has been saved!`,
      type: 'success'
    }));
    if (previousProfile.isNew()) {
      if (this.afUploader.getQueueSize() > 0) {
        setTimeout(() => this.afUploader.uploadFilesInQueue());
      } else {
        this.router.navigate(['/EditProfile', { '@id': profile['@id'] }]);
      }
    }
    Utils.scrollTop();
  }

  onImageChange(image) {
    this.image.updateValue(image, this.controlUpdateOptions);
  }

  changeProfileType($event) {
    let profileType = $event || PROFILE_TYPES.professional;
    this.router.navigate(['/AddProfile', { profileType: profileType }]);
  }

  onProfileTypeChange($event) {
    let profileType = $event || PROFILE_TYPES.professional;
    this.setProfileModel(profileType);
    this.selectedProfile = profileType;
  }

  setProfileModel(type: string) {
    let profileModel: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel;
    let isNew: boolean = this.isAddProfile();
    let profileData = {
      '@id': isNew ? undefined : this.profile && this.profile['@id'],
      user: this.user.value || this.profile.user,
      email: this.profile.email,
      type: type
    };
    if (isNew) {
      profileModel = BaseProfile.create(profileData);
    } else {
      if (this.profileModel && this.profileModel.type !== type) {
        this.profileModel.type = type;
        profileModel = BaseProfile.create(this.profileModel);
      } else {
        profileModel = this.profileModel;
      }
    }
    this.profileModel = profileModel;
  }

  updateProfileModel(profileModelUpdates: any = {}) {
    // TODO: merge arg with this.profileModel
    // Trigger ngOnChange for profile related components
    // this.profileModel = BaseProfile.create(this.profileModel);
  }

  onProfilePhotoUploaded(mediaData: any = {}) {
    let imageSrc = mediaData.contentUrl;
    // this.profileModel.image = imageSrc;
    // Trigger ngOnChange for profile related components
    // TODO: extract this in separate setProfileModel(updated) method
    this.profileModel = BaseProfile.create(this.profileModel);
    if (this.isAddProfile() && !this.afUploader.getQueueSize()) {
      this.router.navigate(['/EditProfile', { '@id': this.profileModel['@id'] }]);
    }
  }

  get isAutoUpload() {
    return (this.profileModel && !this.profileModel.isNew()) || false;
  }
}
