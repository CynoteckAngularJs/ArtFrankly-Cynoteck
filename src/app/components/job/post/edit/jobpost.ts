import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  AfterViewInit,
  ViewChild,
  ViewChildren,
  QueryList
} from 'angular2/core';
import { Observable } from 'rxjs/Observable';
import {
  ROUTER_DIRECTIVES,
  Router,
  RouteParams,
  CanActivate,
  CanDeactivate,
  ComponentInstruction
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
import { JobPostsService } from '../../services/jobposts-service';
import { IJobPost, JobPostStorage, JobPostModel } from '../models';
import { Shared, SigninFormControlls } from '../../../authentication/shared';
import {
  PROFILE_TYPES,
  PROFILES,
  ROUTES,
  NOTIFICATION_TAGS,
  JOB_POSITION_TYPES,
  JOB_SERVICES,
  COUNTIRES,
  US_STATES,
  JOB_POST_STATES
} from '../../../../constants';
import { NotificationsCollection } from '../../../notifications/services/notifications';
import { NotificationModel } from '../../../notifications/notification/notification';
import { checkIfHasPermission } from '../../../authentication/services/token-manager-service';
import { AppService, IApp, DEFAULTS, ACTIONS } from '../../../authentication/services/app-service';
import { Select2 } from '../../../select/select';
import { Ng2Select2 } from '../../../../url/components/ng2select2/select2';
import {
  IProfileEditLD,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel,
  BaseProfile
} from '../../../profiles/models/profiles';
import { Utils } from '../../../../url/utils/index';
import { JobPostPaymentShareModal } from '../payment-share/modal';
// import {JobPostSharetModal} from '../share/modal';
import { UrlValidators } from '../../../../url/validators/validators';
import { Modal, IModal } from '../../../modal/modal';
import { AddressForm } from '../../../../url/components/address/address';

declare var jQuery: any;

@Component({
  selector: 'editjobpost',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    Select2,
    JobPostPaymentShareModal,
    Ng2Select2,
    AddressForm
  ],
  providers: [JobPostsService],
  pipes: [AsyncPipe, JsonPipe],
  styles: [require('./jobpost.css')],
  template: require('./jobpost.html')
})
@CanActivate(checkIfHasPermission)
export class EditJobPost implements OnInit, AfterViewInit, CanDeactivate {
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Input() jobpost: JobPostModel;
  JOB_POSITION_TYPES: any[] = JOB_POSITION_TYPES;
  JOB_SERVICES: any[] = JOB_SERVICES;
  COUNTIRES: any[] = COUNTIRES;
  US_STATES: any[] = US_STATES;
  form: ControlGroup;
  isShowErrors: boolean = false;
  // state: IApp;
  // formInvalid$: Observable<boolean>;
  profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel;
  myprofiles: (ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel)[] = [];
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  @ViewChild(JobPostPaymentShareModal) paymentModalDialog;
  // isShowPaymentModal: boolean = false;
  JOB_POST_STATES: any = JOB_POST_STATES;
  paymentModal: IModal = {
    title: 'Payment',
    hideOnClose: true,
    opened: false
  };
  profileSelect2Options: any = {
    placeholder: 'PROFILE'
  };
  @ViewChildren(AddressForm)
  addressForms: QueryList<AddressForm>;

  resetHiringFields() {
    (<Control>this.form.controls['hiringProfessional'])
      .updateValue(undefined, this.controlUpdateOptions);
    (<Control>this.form.controls['hiringVendor'])
      .updateValue(undefined, this.controlUpdateOptions);
    (<Control>this.form.controls['hiringInstitution'])
      .updateValue(undefined, this.controlUpdateOptions);
  }

  resetProfileFields() {
    (<Control>this.form.controls['profile'])
      .updateValue(undefined, this.controlUpdateOptions);
    (<Control>this.form.controls['organization'])
      .updateValue(undefined, this.controlUpdateOptions);
    (<Control>this.form.controls['url'])
      .updateValue(undefined, this.controlUpdateOptions);
    (<Control>this.form.controls['image'])
      .updateValue(undefined, this.controlUpdateOptions);
  }

  updateProfile(profile: Control, $event) {
    // Handle profile selectbox control issue fix: 
    // TODO: in select2 cmp trigger control markAsDirty and no need for this here than!
    // this.updateControlValue(profile, $event);
    let selectedProfile = (this.myprofiles || []).find((myprofile) => myprofile['@id'] === $event);
    this.onProfileUpdate(selectedProfile);
  }

  constructor(
    private builder: FormBuilder,
    private router: Router,
    private routeParams: RouteParams,
    private jobPostsService: JobPostsService,
    private notificationsSvc: NotificationsCollection,
    public appSrv: AppService
  ) {
    this.initForm();
    let selectedMyProfilesDisposable = this.appSrv.$stream
      .map((state) => state.myProfiles)
      .subscribe((myprofiles) => {
        this.myprofiles = myprofiles;
      });
    let selectedProfileDisposable = this.appSrv.$stream
      .map((state) => state.selectedProfile)
      .subscribe((profile) => {
        this.onProfileUpdate(Object.assign({}, profile));
      });
  }

  isSubmitMode() {
    return this.routeParams.get('mode') === 'submit';
  }

  onProfileUpdate(profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel) {
    // profile = Object.assign({}, profile);
    // this.profile = profile;
    // let profileModel = new ProfileEditLDModel(profile);
    /* tslint:disable */
    let profileModel: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel = BaseProfile.create(profile);
    /* tslint:enable */
    /* tslint:disable */
    this.resetHiringFields();
    this.resetProfileFields();
    if (profileModel.isProfessional()) {
      (<Control>this.form.controls['hiringProfessional']).updateValue(profile['@id'], this.controlUpdateOptions);
    } else if (profileModel.isVendor()) {
      (<Control>this.form.controls['hiringVendor']).updateValue(profile['@id'], this.controlUpdateOptions);
    } else if (profileModel.isInstitution()) {
      (<Control>this.form.controls['hiringInstitution']).updateValue(profile['@id'], this.controlUpdateOptions);
    }
    /* tslint:enable */
    (<Control>this.form.controls['organization'])
      .updateValue(profileModel.toString(), this.controlUpdateOptions);
    (<Control>this.form.controls['image'])
      .updateValue(profileModel.image && profileModel.image.contentUrl, this.controlUpdateOptions);
    (<Control>this.form.controls['profile'])
      .updateValue(profileModel['@id'], this.controlUpdateOptions);
  }

  ngOnInit() {
    this.getJobPost();
    if (this.isSubmitMode()) {
      this.saveOrUpdate(Object.assign({}, this.form.value, {
        contactLocation: this.jobpost.contactLocation,
        jobLocation: this.jobpost.jobLocation
      }));
    }
  }

  onAddressChange(location: any, locationFieldName) {
    let loc = {};
    loc[locationFieldName] = location;
    if (location) {
      this.persistData(loc);
    }
  }

  ngAfterViewInit() {
    //   if (this.addressForms && this.addressForms.first) {
    //     // job location
    //     this.addressForms.first.form.valueChanges.subscribe((values) => {
    //         this.persistData({
    //           jobLocation: values.location
    //         });
    //       });
    //     // this.addressForms.first.setFormValues(this.jobpost.jobLocation);
    //   }
    //   if (this.addressForms && this.addressForms.last) {
    //     // contact location
    //     this.addressForms.last.form.valueChanges.subscribe((values) => {
    //         this.persistData({
    //           contactLocation: values.location
    //         });
    //       });
    //     // this.addressForms.first.setFormValues(this.jobpost.contactLocation);
    //   }
  }

  routerCanDeactivate(next: ComponentInstruction, previous: ComponentInstruction) {
    console.log('canDeactivate ', next, previous);
    if (!this.isAdd()) {
      JobPostStorage.invalidate();
    }
  }

  setFormValues(jobpost: IJobPost = {}) {
    let isSubmitMode = this.isSubmitMode();
    jobpost = this.getJobPostValue(jobpost);
    /* tslint:disable */
    (<Control>this.form.controls['id']).updateValue(JobPostModel.extractId(jobpost['@id']), this.controlUpdateOptions);
    (<Control>this.form.controls['@id']).updateValue(jobpost['@id'], this.controlUpdateOptions);
    (<Control>this.form.controls['datePosted']).updateValue(jobpost.datePosted, this.controlUpdateOptions);
    (<Control>this.form.controls['description']).updateValue(jobpost.description, this.controlUpdateOptions);
    (<Control>this.form.controls['title']).updateValue(jobpost.title, this.controlUpdateOptions);
    (<Control>this.form.controls['contactemail']).updateValue(jobpost.contactemail, this.controlUpdateOptions);
    (<Control>this.form.controls['additional']).updateValue(jobpost.additional, this.controlUpdateOptions);
    (<Control>this.form.controls['contactname']).updateValue(jobpost.contactname, this.controlUpdateOptions);
    (<Control>this.form.controls['contactphone']).updateValue(jobpost.contactphone, this.controlUpdateOptions);
    (<Control>this.form.controls['favorite']).updateValue(jobpost.favorite, this.controlUpdateOptions);
    (<Control>this.form.controls['position']).updateValue(jobpost.position, this.controlUpdateOptions);
    (<Control>this.form.controls['industry']).updateValue(jobpost.industry, this.controlUpdateOptions);
    (<Control>this.form.controls['organization']).updateValue(jobpost.organization, this.controlUpdateOptions);
    (<Control>this.form.controls['url']).updateValue(jobpost.url || (isSubmitMode ? '' : ''), this.controlUpdateOptions);
    (<Control>this.form.controls['image']).updateValue(jobpost.image, this.controlUpdateOptions);
    (<Control>this.form.controls['archived']).updateValue(jobpost.archived, this.controlUpdateOptions);
    let position = jobpost.hiringProfessional || jobpost.hiringVendor || jobpost.hiringInstitution || '';
    let positionValue = jQuery.isPlainObject(position) ? position && position['@id'] : position;
    // (<Control> this.form.controls['profile']).updateValue(position, this.controlUpdateOptions);
    (<Control>this.form.controls['profile']).updateValue(positionValue, this.controlUpdateOptions);
    // TODO: this.onProfileUpdate? no need! But what if someone is trynig to edit someone elses post!? Profile id will be overridden!!
    //  IMPORTANT: So don't update profile if its edit page and profile exists in model!!!
    // (<Control> this.form.controls['jobLocation']['controls']['@id']).updateValue(jobpost.jobLocation['@id'], this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['name']).updateValue(jobpost.jobLocation.name, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['@id']).updateValue(jobpost.jobLocation.address['@id'], this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['addressCountry']).updateValue(jobpost.jobLocation.address.addressCountry, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['addressLocality']).updateValue(jobpost.jobLocation.address.addressLocality, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['addressRegion']).updateValue(jobpost.jobLocation.address.addressRegion, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['postalCode']).updateValue(jobpost.jobLocation.address.postalCode, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['postOfficeBoxNumber']).updateValue(jobpost.jobLocation.address.postOfficeBoxNumber, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['streetAddress']).updateValue(jobpost.jobLocation.address.streetAddress, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['telephone']).updateValue(jobpost.jobLocation.address.telephone, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['apartment']).updateValue(jobpost.jobLocation.address.apartment, this.controlUpdateOptions);
    // (<Control> this.form.controls['jobLocation']['controls']['address']['controls']['city']).updateValue(jobpost.jobLocation.address.city, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['@id']).updateValue(jobpost.contactLocation['@id'], this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['name']).updateValue(jobpost.contactLocation.name, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['@id']).updateValue(jobpost.contactLocation.address['@id'], this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['addressCountry']).updateValue(jobpost.contactLocation.address.addressCountry, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['addressLocality']).updateValue(jobpost.contactLocation.address.addressLocality, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['addressRegion']).updateValue(jobpost.contactLocation.address.addressRegion, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['postalCode']).updateValue(jobpost.contactLocation.address.postalCode, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['postOfficeBoxNumber']).updateValue(jobpost.contactLocation.address.postOfficeBoxNumber, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['streetAddress']).updateValue(jobpost.contactLocation.address.streetAddress, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['telephone']).updateValue(jobpost.contactLocation.address.telephone, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['apartment']).updateValue(jobpost.contactLocation.address.apartment, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['city']).updateValue(jobpost.contactLocation.address.city, this.controlUpdateOptions);
    /* tslint:enable */
  }

  getJobPostValue(jobpost: IJobPost = {}): IJobPost {
    let defaults = { contactLocation: { address: {} }, jobLocation: { address: {} } };
    return Object.assign(defaults, jobpost);
  }

  initForm() {
    let isSubmitMode = this.isSubmitMode();
    let jobpost: IJobPost = this.getJobPostValue(this.jobpost);
    // temporary disabled: image: [jobpost.image, UrlValidators.url],
    this.form = this.builder.group({
      id: [JobPostModel.extractId(jobpost['@id'])],
      '@id': [jobpost['@id']],
      datePosted: [jobpost.datePosted],
      description: [jobpost.description],
      title: [jobpost.title, Validators.required],
      contactemail: [jobpost.contactemail || (isSubmitMode ? '' : ''), UrlValidators.emailValidationWithoutRequired],
      additional: [jobpost.additional],
      contactname: [jobpost.contactname],
      contactphone: [jobpost.contactphone],
      favorite: [jobpost.favorite],
      position: [jobpost.position],
      industry: [jobpost.industry, Validators.required],
      organization: [jobpost.organization],
      image: [jobpost.image],

      url: [jobpost.url || (isSubmitMode ? '' : ''), UrlValidators.url],

      hiringProfessional: [jobpost.hiringProfessional],
      hiringVendor: [jobpost.hiringVendor],
      hiringInstitution: [jobpost.hiringInstitution],
      profile: [
        jobpost.hiringProfessional ||
        jobpost.hiringVendor ||
        jobpost.hiringInstitution || '',
        Validators.required
      ],
      archived: [jobpost.archived],
      // jobLocation: this.builder.group({
      //   '@id': [jobpost.jobLocation['@id']],
      //   '@type': ['http://schema.org/Place'],
      //   name: [jobpost.jobLocation.name],
      //   address: this.builder.group({
      //     '@id': [jobpost.jobLocation.address['@id']],
      //     '@type': ['http://schema.org/PostalAddress'],
      //     addressCountry: [jobpost.jobLocation.address.addressCountry],
      //     addressLocality: [jobpost.jobLocation.address.addressLocality],
      //     addressRegion: [jobpost.jobLocation.address.addressRegion],
      //     postalCode: [jobpost.jobLocation.address.postalCode],
      //     postOfficeBoxNumber: [jobpost.jobLocation.address.postOfficeBoxNumber],
      //     streetAddress: [jobpost.jobLocation.address.streetAddress],
      //     telephone: [jobpost.jobLocation.address.telephone],
      //     apartment: [jobpost.jobLocation.address.apartment],
      //     city: [jobpost.jobLocation.address.city],
      //   })
      // }),
      // contactLocation: this.builder.group({
      //   '@id': [jobpost.contactLocation['@id']],
      //   '@type': ['http://schema.org/Place'],
      //   name: [jobpost.contactLocation.name],
      //   address: this.builder.group({
      //     '@id': [jobpost.contactLocation.address['@id']],
      //     '@type': ['http://schema.org/PostalAddress'],
      //     addressCountry: [jobpost.contactLocation.address.addressCountry],
      //     addressLocality: [jobpost.contactLocation.address.addressLocality],
      //     addressRegion: [jobpost.contactLocation.address.addressRegion],
      //     postalCode: [jobpost.contactLocation.address.postalCode],
      //     postOfficeBoxNumber: [jobpost.contactLocation.address.postOfficeBoxNumber],
      //     streetAddress: [jobpost.contactLocation.address.streetAddress],
      //     telephone: [jobpost.contactLocation.address.telephone],
      //     apartment: [jobpost.contactLocation.address.apartment],
      //     city: [jobpost.contactLocation.address.city],
      //   })
      // })
    });

    // this.formInvalid$ = this.form.valueChanges
    //   .map(this.canSaveOrUpdate.bind(this))
    //   .map((formValid) => !formValid);
  }

  isRoute(linkParams: any[]): boolean {
    return this.router.parent.isRouteActive(this.router.generate(linkParams));
  }

  isAdd() {
    // return this.isRoute(['/AddJobPost']);
    return !this.routeParams.get('id');
  }

  getJobPost() {
    let isAddProfile = this.isAdd();
    if (isAddProfile) {
      this.jobpost = Object.assign({}, JobPostStorage.get());
      this.setFormValues(this.jobpost);
    } else {
      let id = this.routeParams.get('uId');
      this.jobPostsService.get(id).subscribe(
        (response: JobPostModel) => {
          this.jobpost = response;
          // TODO: go through each property of JobPostStorage.get() 
          // and copy it if its value is defined
          // this.jobpost = Object.assign({}, response, JobPostStorage.get());
          this.setFormValues(this.jobpost);
        },
        (error) => {
          console.log('ERROR ', error);
        }
      );
    }
  }

  saveOrUpdate(serializedForm: IJobPost) {
    if (this.addressForms && this.addressForms.first) {
      // set job location
      let jobLocation = this.addressForms.first.form.value.location;
      serializedForm.jobLocation = jobLocation;
    }
    if (this.addressForms && this.addressForms.last) {
      // set contact location
      let contactLocation = this.addressForms.last.form.value.location;
      serializedForm.contactLocation = contactLocation;
    }
    if (this.canSaveOrUpdate()) {
      this.jobPostsService[this.isAdd() ? 'save' : 'update'](serializedForm).subscribe(
        ((resp: JobPostModel) => {
          this.isShowErrors = false;
          JobPostStorage.invalidate();
          let msg = `Job Post has been saved!`;
          let activeProfile = this.appSrv.getActiveProfile();
          if (serializedForm.profile !== activeProfile['@id']) {
            /* tslint:disable */
            msg += ` Please select the ${serializedForm.organization} profile to see the job post you have just created!`;
            /* tslint:enable */
          }
          this.notificationsSvc.push(new NotificationModel({
            message: msg,
            type: 'success'
          }));
          if (this.isAdd()) {
            this.jobpost = resp;
            this.setFormValues(this.jobpost);
            this.paymentModal.opened = true;
            // trigger nr of jobposts update - add to appService new post
            if (serializedForm.profile === activeProfile['@id']) {
              this.appSrv.addSelectedProfileJobPost(this.jobpost);
            }
            Utils.scrollTop();
          } else {
            this.router.navigate(['/EditJobPost', { 'id': serializedForm.title.trim().replace(/[^A-Za-z0-9]+/g, '-'), uId: JobPostModel.extractId(resp['@id']) }]);
          }
        }).bind(this),
        ((resp) => {
          this.isShowErrors = false;
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving job post!`,
            type: 'danger'
          }));
          Utils.scrollTop();
        }).bind(this)
      );
    } else {
      Utils.scrollTop();
    }
  }

  canSaveOrUpdate() {
    this.isShowErrors = !this.form.valid;
    return this.form.valid;
  }

  getData(): any {
    let stored = JobPostStorage.get() || {};
    delete stored.id;
    delete stored['@id'];
    return stored;
  }

  persistData(values = {}) {
    if (this.isAdd()) {
      let jobpost = Object.assign(this.getData(),
        (this.form && this.form.value) || {}, values || {});
      delete jobpost.id;
      delete jobpost['@id'];
      JobPostStorage.set(jobpost);
    }
  }

  onPaymentSuccess($event) {
    console.log('onPaymentSuccess($event) ', $event);
  }

  onPaymentShareModalClose($event) {
    // console.log('onPaymentShareModalClose');
    // this.router.navigate(['/EditJobPost', { id: JobPostModel.extractId(this.jobpost['@id']) }]);
    // Utils.scrollTop();
    this.paymentModal.opened = false;
  }

  showPaymentShareModal($event) {
    $event.preventDefault();
    this.paymentModal.opened = true;
  }

  commingSoon($event) {
    $event.preventDefault();
    this.notificationsSvc.push(new NotificationModel({
      message: `Coming Soon!`,
      type: 'success'
    }));
  }
}
