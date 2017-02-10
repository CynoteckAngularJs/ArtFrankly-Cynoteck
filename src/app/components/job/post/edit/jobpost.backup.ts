import {Component, Input, Output, EventEmitter, OnInit} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
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
import {JobPostsService} from '../../services/jobposts-service';
import {IJobPost} from '../models';
import {Shared, SigninFormControlls} from '../../../authentication/shared';
import {
  PROFILE_TYPES,
  PROFILES,
  ROUTES,
  NOTIFICATION_TAGS,
  JOB_POSITION_TYPES,
  JOB_SERVICES
} from '../../../../constants';
import {NotificationsCollection} from '../../../notifications/services/notifications';
import {NotificationModel} from '../../../notifications/notification/notification';
import {checkIfHasPermission} from '../../../authentication/services/token-manager-service';
import {AppService, IApp, DEFAULTS, ACTIONS} from '../../../authentication/services/app-service';
import {AddressForm} from '../../../address/form/address';

@Component({
  selector: 'editjobpost',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, AddressForm],
  providers: [JobPostsService],
  pipes: [AsyncPipe, JsonPipe],
  styles: [require('./jobpost.css')],
  template: require('./jobpost.html')
})
@CanActivate(checkIfHasPermission)
export class EditJobPost implements OnInit {
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Input() jobpost: IJobPost;
  JOB_POSITION_TYPES: any[] = JOB_POSITION_TYPES;
  JOB_SERVICES: any[] = JOB_SERVICES;
  form: ControlGroup;
  hiringOrganisationGroup: ControlGroup;
  jobLocationGroup: ControlGroup;
  contactLocationAddressGroup: ControlGroup;
  contactLocationGroup: ControlGroup;
  generalGroup: ControlGroup;
  id: Control;
  datePosted: Control;
  description: Control;
  title: Control;
  favorite: Control;
  position: Control;
  industry: Control;
  organization: Control;
  hiringProfessional: Control;
  hiringVendor: Control;
  hiringInstitution: Control;
  archived: Control;
  CLid: Control;
  CLname: Control;
  CLAid: Control;
  CLAaddressCountry: Control;
  CLAaddressLocality: Control;
  CLAaddressRegion: Control;
  CLApostalCode: Control;
  CLApostOfficeBoxNumber: Control;
  CLAstreetAddress: Control;
  CLAtelephone: Control;
  CLAapartment: Control;
  CLAcity: Control;
  // state: IApp;
  // formInvalid$: Observable<boolean>;
  // controlUpdateOptions: any = { onlySelf: true, emitEvent: true };

  constructor(
    private builder: FormBuilder,
    private router: Router,
    private routeParams: RouteParams,
    private jobPostsService: JobPostsService,
    private notificationsSvc: NotificationsCollection,
    public appSrv: AppService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.getJobPost();
  }

  setFormValues(jobpost: IJobPost = {}) {
    // let p = Object.assign({ type: PROFILE_TYPES.professional }, profile);
    // this.profileType.updateValue(p.type, this.controlUpdateOptions);
    // this.givenName.updateValue(p.givenName, this.controlUpdateOptions);
    // this.familyName.updateValue(p.familyName, this.controlUpdateOptions);
    // this.name.updateValue(p.name, this.controlUpdateOptions);
    // this.description.updateValue(p.description, this.controlUpdateOptions);
    // this.telephone.updateValue(p.telephone, this.controlUpdateOptions);
    // this.image.updateValue(p.image, this.controlUpdateOptions);
    // this.user.updateValue(p.user, this.controlUpdateOptions);
    // this.id.updateValue(profile['@id'], this.controlUpdateOptions);
  }

  getJobPostValue(jobpost: IJobPost = {}): IJobPost {
    return Object.assign({ contactLocation: { address: {} } }, jobpost);
  }

  initForm() {
    let jobpost: IJobPost = this.getJobPostValue(this.jobpost);
    this.id = new Control(jobpost.id);
    this.datePosted = new Control(jobpost.datePosted);
    this.description = new Control(jobpost.description, Validators.required);
    this.title = new Control(jobpost.title, Validators.required);
    this.favorite = new Control(jobpost.favorite, Validators.required);
    this.position = new Control(jobpost.position);
    this.industry = new Control(jobpost.industry);
    this.organization = new Control(jobpost.organization);
    this.hiringProfessional = new Control(jobpost.hiringProfessional);
    this.hiringVendor = new Control(jobpost.hiringVendor);
    this.hiringInstitution = new Control(jobpost.hiringInstitution);
    this.archived = new Control(jobpost.archived);
    // this.nonProfessionalGroup = new ControlGroup({
    //   name: this.name
    // });
    this.CLid = new Control(jobpost.contactLocation.id);
    this.CLname = new Control(jobpost.contactLocation.name);
    this.CLAid = new Control(jobpost.contactLocation.address.id);
    this.CLAaddressCountry = new Control(jobpost.contactLocation.address.addressCountry);
    this.CLAaddressLocality = new Control(jobpost.contactLocation.address.addressLocality);
    this.CLAaddressRegion = new Control(jobpost.contactLocation.address.addressRegion);
    this.CLApostalCode = new Control(jobpost.contactLocation.address.postalCode);
    this.CLApostOfficeBoxNumber = new Control(jobpost.contactLocation.address.postOfficeBoxNumber);
    this.CLAstreetAddress = new Control(jobpost.contactLocation.address.streetAddress);
    this.CLAtelephone = new Control(jobpost.contactLocation.address.telephone);
    this.CLAapartment = new Control(jobpost.contactLocation.address.apartment);
    this.CLAcity = new Control(jobpost.contactLocation.address.city);
    this.contactLocationAddressGroup = new ControlGroup({
      id: this.CLAid,
      addressCountry: this.CLAaddressCountry,
      addressLocality: this.CLAaddressLocality,
      addressRegion: this.CLAaddressRegion,
      postalCode: this.CLApostalCode,
      postOfficeBoxNumber: this.CLApostOfficeBoxNumber,
      streetAddress: this.CLAstreetAddress,
      telephone: this.CLAtelephone,
      apartment: this.CLAapartment,
      city: this.CLAcity,
    });
    this.contactLocationGroup = new ControlGroup({
      id: this.CLid,
      name: this.CLname,
      address: this.contactLocationAddressGroup
    });
    this.generalGroup = new ControlGroup({
      id: this.id,
      datePosted: this.datePosted,
      description: this.description,
      title: this.title,
      favorite: this.favorite,
      position: this.position,
      industry: this.industry,
      organization: this.organization,
      hiringProfessional: this.hiringProfessional,
      hiringVendor: this.hiringVendor,
      hiringInstitution: this.hiringInstitution,
      archived: this.archived,
    });
    this.form = this.builder.group({
      general: this.generalGroup,
      jobLocation: this.jobLocationGroup,
      contactLocation: this.contactLocationGroup
		});

    // this.formInvalid$ = this.form.valueChanges
    //   .map(this.canSaveOrUpdate.bind(this))
    //   .map((formValid) => !formValid);
  }

  isRoute(linkParams: any[]): boolean {
    return this.router.parent.isRouteActive(this.router.generate(linkParams));
  }

  isAdd() {
    return this.isRoute(['/AddJobPost']);
  }

  getJobPost() {
    let isAddProfile = this.isAdd();
    if (isAddProfile) {
      this.jobpost = {};
      this.setFormValues(this.jobpost);
    } else {
      let resourcePath = this.routeParams.get('@id');
      this.jobPostsService.get(resourcePath).subscribe(
        (response: IJobPost) => {
          this.jobpost = response;
          this.setFormValues(this.jobpost);
        },
        (error) => {
          console.log('ERROR ', error);
        }
      );
    }
  }

  // updateMyProfilesStore(profile: ProfileEditLDModel) {
  //   let myProfiles = [...this.myProfiles];
  //   // TODO: Validate if profile is valid!
  //   if (this.isAddProfile()) {
  //     myProfiles.push(profile);
  //   } else {
  //     myProfiles = myProfiles.map((myProfile) => {
  //       return profile['@id'] === myProfile['@id'] ? Object.assign({}, profile) : myProfile;
  //     });
  //   }
  //   this.appSrv.setMyProfiles(myProfiles);
  // }

  // serializeForm(serializedForm: IEditForm): IProfileEditLD {
  //   let general = Object.assign({}, serializedForm.general);
  //   general['@id'] = general.id;
  //   delete general.id;
  //   return Object.assign({ type: serializedForm.profileType },
  //     general,
  //     serializedForm.professional,
  //     serializedForm.nonProfessional
  //     );
  // }

  saveOrUpdate(serializedForm: IJobPost) {
    // let profile: IProfileEditLD = this.serializeForm(serializedForm);
    let operation = this.isAdd() ? 'save' : 'update';
    console.log('serializedForm : IJobPost', serializedForm);
    // this.jobPostsService[operation](serializedForm).subscribe(
    //   ((resp) => {
    //     // this.updateMyProfilesStore(resp);
    //     this.notificationsSvc.push(new NotificationModel({
    //       message: `Job Post has been saved!`,
    //       type: 'success'
    //     }));
    //   }).bind(this),
    //   ((resp) => {
    //     this.notificationsSvc.push(new NotificationModel({
    //       message: `Error has occured while saving job post!`,
    //       type: 'danger'
    //     }));
    //   }).bind(this)
    // );
  }

  canSaveOrUpdate(values) {
    // let profileType = values.profileType;
    // let isProfileTypeValid = this.profileType.valid;
    // let isGeneralValid = this.generalGroup.valid;
    // let isProfessionalGroupValid = this.professionalGroup.valid;
    // let isNonProfessionalGroupValid = this.nonProfessionalGroup.valid;
    // let isFormValid = isProfileTypeValid && isGeneralValid;
    // if (profileType === PROFILE_TYPES.professional) {
    //   isFormValid = isFormValid && isProfessionalGroupValid;
    // } else {
    //   isFormValid = isFormValid && isNonProfessionalGroupValid;
    // }
    // return isFormValid;
    return true;
  }
}
