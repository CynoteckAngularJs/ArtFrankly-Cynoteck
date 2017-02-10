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
import { SpacePostsService } from '../../services/spaceposts-service';
import { ISpacePost, SpacePostStorage, SpacePostModel } from '../models';
import { Shared, SigninFormControlls } from '../../../authentication/shared';
import {
  PROFILE_TYPES,
  PROFILES,
  ROUTES,
  NOTIFICATION_TAGS,
  SPACE_POSITION_TYPES,
  SPACE_SERVICES,
  COUNTIRES,
  US_STATES,
  SPACE_POST_STATES,
  UPLOADER
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
import {
  Utils,
  UploadModel
} from '../../../../url/utils/index';
import { SpacePostPaymentShareModal } from '../payment-share/modal';
// import {SpacePostSharetModal} from '../share/modal';
import { UrlValidators } from '../../../../url/validators/validators';
import { Modal, IModal } from '../../../modal/modal';
import { AddressForm } from '../../../../url/components/address/address';

import { AFUploader } from '../../../af-uploader/af-uploader';
import { AFMultiUploader } from '../../../af-uploader/af-multi-uploader';
import { UPLOAD_DIRECTIVES } from '../../../../url/components/ng2-uploader/ng2-uploader';
import { ProfileIdService } from '../../../projects/services/projects-service';

declare var jQuery: any;

@Component({
  selector: 'editspacepost',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...UPLOAD_DIRECTIVES,
    NgClass,
    Select2,
    SpacePostPaymentShareModal,
    Ng2Select2,
    AddressForm,
    AFUploader,
    AFMultiUploader
  ],
  providers: [SpacePostsService],
  pipes: [AsyncPipe, JsonPipe],
  styles: [require('./spacepost.css')],
  template: require('./spacepost.html')
})
@CanActivate(checkIfHasPermission)
export class EditSpacePost implements OnInit, AfterViewInit, CanDeactivate {
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Input() spacepost: SpacePostModel;
  SPACE_POSITION_TYPES: any[] = SPACE_POSITION_TYPES;
  SPACE_SERVICES: any[] = SPACE_SERVICES;
  COUNTIRES: any[] = COUNTIRES;
  US_STATES: any[] = US_STATES;
  form: ControlGroup;
  isShowErrors: boolean = false;
  image: Control;
  // state: IApp;
  // formInvalid$: Observable<boolean>;
  profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel;
  myprofiles: (ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel)[] = [];
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  UPLOADER: any = UPLOADER;


  @ViewChild(AFUploader) afUploader;
  @ViewChild(AFMultiUploader) afMultiUploader;

  profileTypeSelect2Options: any = {
    minimumResultsForSearch: -1
  };
  @ViewChild(SpacePostPaymentShareModal) paymentModalDialog;
  // isShowPaymentModal: boolean = false;
  SPACE_POST_STATES: any = SPACE_POST_STATES;
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

  filesToUpload: any[] = [];
  multiFilesToUpload: any[] = [];
  uploadedItems: UploadModel[] = [];
  nrOfUploadedFiles: number = 0;
  isFeaturedImage: boolean = false;
  featuredImage: string = '';

  isAdditionalImage: boolean = false;
  additionalImage: any[] = [];

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
    private spacePostsService: SpacePostsService,
    private notificationsSvc: NotificationsCollection,
    public appSrv: AppService,
    public profileIdService: ProfileIdService
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
    // (<Control> this.form.controls['organization'])
    //   .updateValue(profileModel.toString(), this.controlUpdateOptions);
    (<Control>this.form.controls['image'])
      .updateValue(profileModel.image && profileModel.image.contentUrl, this.controlUpdateOptions);
    (<Control>this.form.controls['profile'])
      .updateValue(profileModel['@id'], this.controlUpdateOptions);

    // (<Control> this.form.controls['size'])
    //   .updateValue(profileModel.toString(), this.controlUpdateOptions);

    // (<Control> this.form.controls['pricing'])
    //   .updateValue(profileModel.toString(), this.controlUpdateOptions);
  }

  ngOnInit() {
    this.getSpacePost();
    if (this.isSubmitMode()) {
      this.saveOrUpdate(Object.assign({}, this.form.value, {
        contactLocation: this.spacepost.contactLocation,
        spaceLocation: this.spacepost.spaceLocation
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
    //     // space location
    //     this.addressForms.first.form.valueChanges.subscribe((values) => {
    //         this.persistData({
    //           spaceLocation: values.location
    //         });
    //       });
    //     // this.addressForms.first.setFormValues(this.spacepost.spaceLocation);
    //   }
    //   if (this.addressForms && this.addressForms.last) {
    //     // contact location
    //     this.addressForms.last.form.valueChanges.subscribe((values) => {
    //         this.persistData({
    //           contactLocation: values.location
    //         });
    //       });
    //     // this.addressForms.first.setFormValues(this.spacepost.contactLocation);
    //   }
  }

  routerCanDeactivate(next: ComponentInstruction, previous: ComponentInstruction) {
    console.log('canDeactivate ', next, previous);
    if (!this.isAdd()) {
      SpacePostStorage.invalidate();
    }
  }

  setFormValues(spacepost: ISpacePost = {}) {
    let isSubmitMode = this.isSubmitMode();
    spacepost = this.getSpacePostValue(spacepost);
    /* tslint:disable */
    (<Control>this.form.controls['id']).updateValue(SpacePostModel.extractId(spacepost['@id']), this.controlUpdateOptions);
    (<Control>this.form.controls['@id']).updateValue(spacepost['@id'], this.controlUpdateOptions);
    (<Control>this.form.controls['datePosted']).updateValue(spacepost.datePosted, this.controlUpdateOptions);
    (<Control>this.form.controls['description']).updateValue(spacepost.description, this.controlUpdateOptions);
    (<Control>this.form.controls['title']).updateValue(spacepost.title, this.controlUpdateOptions);
    (<Control>this.form.controls['contactemail']).updateValue(spacepost.contactemail, this.controlUpdateOptions);
    (<Control>this.form.controls['additional']).updateValue(spacepost.additional, this.controlUpdateOptions);
    (<Control>this.form.controls['contactname']).updateValue(spacepost.contactname, this.controlUpdateOptions);
    (<Control>this.form.controls['contactphone']).updateValue(spacepost.contactphone, this.controlUpdateOptions);
    (<Control>this.form.controls['favorite']).updateValue(spacepost.favorite, this.controlUpdateOptions);
    (<Control>this.form.controls['position']).updateValue(spacepost.position, this.controlUpdateOptions);

    (<Control>this.form.controls['organization']).updateValue(spacepost.organization, this.controlUpdateOptions);

    (<Control>this.form.controls['size']).updateValue(spacepost.size, this.controlUpdateOptions);

    (<Control>this.form.controls['pricing']).updateValue(spacepost.pricing, this.controlUpdateOptions);


    (<Control>this.form.controls['url']).updateValue(spacepost.url || (isSubmitMode ? '' : ''), this.controlUpdateOptions);
    (<Control>this.form.controls['image']).updateValue(spacepost.image, this.controlUpdateOptions);
    (<Control>this.form.controls['archived']).updateValue(spacepost.archived, this.controlUpdateOptions);
    let position = spacepost.hiringProfessional || spacepost.hiringVendor || spacepost.hiringInstitution || '';
    let positionValue = jQuery.isPlainObject(position) ? position && position['@id'] : position;
    // (<Control> this.form.controls['profile']).updateValue(position, this.controlUpdateOptions);
    (<Control>this.form.controls['profile']).updateValue(positionValue, this.controlUpdateOptions);
    // TODO: this.onProfileUpdate? no need! But what if someone is trynig to edit someone elses post!? Profile id will be overridden!!
    //  IMPORTANT: So don't update profile if its edit page and profile exists in model!!!
    // (<Control> this.form.controls['spaceLocation']['controls']['@id']).updateValue(spacepost.spaceLocation['@id'], this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['name']).updateValue(spacepost.spaceLocation.name, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['@id']).updateValue(spacepost.spaceLocation.address['@id'], this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['addressCountry']).updateValue(spacepost.spaceLocation.address.addressCountry, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['addressLocality']).updateValue(spacepost.spaceLocation.address.addressLocality, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['addressRegion']).updateValue(spacepost.spaceLocation.address.addressRegion, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['postalCode']).updateValue(spacepost.spaceLocation.address.postalCode, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['postOfficeBoxNumber']).updateValue(spacepost.spaceLocation.address.postOfficeBoxNumber, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['streetAddress']).updateValue(spacepost.spaceLocation.address.streetAddress, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['telephone']).updateValue(spacepost.spaceLocation.address.telephone, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['apartment']).updateValue(spacepost.spaceLocation.address.apartment, this.controlUpdateOptions);
    // (<Control> this.form.controls['spaceLocation']['controls']['address']['controls']['city']).updateValue(spacepost.spaceLocation.address.city, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['@id']).updateValue(spacepost.contactLocation['@id'], this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['name']).updateValue(spacepost.contactLocation.name, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['@id']).updateValue(spacepost.contactLocation.address['@id'], this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['addressCountry']).updateValue(spacepost.contactLocation.address.addressCountry, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['addressLocality']).updateValue(spacepost.contactLocation.address.addressLocality, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['addressRegion']).updateValue(spacepost.contactLocation.address.addressRegion, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['postalCode']).updateValue(spacepost.contactLocation.address.postalCode, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['postOfficeBoxNumber']).updateValue(spacepost.contactLocation.address.postOfficeBoxNumber, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['streetAddress']).updateValue(spacepost.contactLocation.address.streetAddress, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['telephone']).updateValue(spacepost.contactLocation.address.telephone, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['apartment']).updateValue(spacepost.contactLocation.address.apartment, this.controlUpdateOptions);
    // (<Control> this.form.controls['contactLocation']['controls']['address']['controls']['city']).updateValue(spacepost.contactLocation.address.city, this.controlUpdateOptions);
    /* tslint:enable */
  }

  getSpacePostValue(spacepost: ISpacePost = {}): ISpacePost {
    let defaults = { contactLocation: { address: {} }, spaceLocation: { address: {} } };
    return Object.assign(defaults, spacepost);
  }

  initForm() {
    let isSubmitMode = this.isSubmitMode();
    let spacepost: ISpacePost = this.getSpacePostValue(this.spacepost);
    // temporary disabled: image: [spacepost.image, UrlValidators.url],
    this.form = this.builder.group({
      id: [SpacePostModel.extractId(spacepost['@id'])],
      '@id': [spacepost['@id']],
      datePosted: [spacepost.datePosted],
      description: [spacepost.description],
      title: [spacepost.title, Validators.required],


      contactemail: [spacepost.contactemail || (isSubmitMode ? '' : ''), UrlValidators.emailValidationWithoutRequired],


      additional: [spacepost.additional],
      contactname: [spacepost.contactname],
      contactphone: [spacepost.contactphone],
      favorite: [spacepost.favorite],
      position: [spacepost.position],
      organization: [spacepost.organization],

      size: [spacepost.size],
      pricing: [spacepost.pricing],

      image: [spacepost.image],

      url: [spacepost.url || (isSubmitMode ? '' : ''), UrlValidators.url],

      hiringProfessional: [spacepost.hiringProfessional],
      hiringVendor: [spacepost.hiringVendor],
      hiringInstitution: [spacepost.hiringInstitution],
      profile: [
        spacepost.hiringProfessional ||
        spacepost.hiringVendor ||
        spacepost.hiringInstitution || '',
        Validators.required
      ],
      archived: [spacepost.archived],
      // spaceLocation: this.builder.group({
      //   '@id': [spacepost.spaceLocation['@id']],
      //   '@type': ['http://schema.org/Place'],
      //   name: [spacepost.spaceLocation.name],
      //   address: this.builder.group({
      //     '@id': [spacepost.spaceLocation.address['@id']],
      //     '@type': ['http://schema.org/PostalAddress'],
      //     addressCountry: [spacepost.spaceLocation.address.addressCountry],
      //     addressLocality: [spacepost.spaceLocation.address.addressLocality],
      //     addressRegion: [spacepost.spaceLocation.address.addressRegion],
      //     postalCode: [spacepost.spaceLocation.address.postalCode],
      //     postOfficeBoxNumber: [spacepost.spaceLocation.address.postOfficeBoxNumber],
      //     streetAddress: [spacepost.spaceLocation.address.streetAddress],
      //     telephone: [spacepost.spaceLocation.address.telephone],
      //     apartment: [spacepost.spaceLocation.address.apartment],
      //     city: [spacepost.spaceLocation.address.city],
      //   })
      // }),
      // contactLocation: this.builder.group({
      //   '@id': [spacepost.contactLocation['@id']],
      //   '@type': ['http://schema.org/Place'],
      //   name: [spacepost.contactLocation.name],
      //   address: this.builder.group({
      //     '@id': [spacepost.contactLocation.address['@id']],
      //     '@type': ['http://schema.org/PostalAddress'],
      //     addressCountry: [spacepost.contactLocation.address.addressCountry],
      //     addressLocality: [spacepost.contactLocation.address.addressLocality],
      //     addressRegion: [spacepost.contactLocation.address.addressRegion],
      //     postalCode: [spacepost.contactLocation.address.postalCode],
      //     postOfficeBoxNumber: [spacepost.contactLocation.address.postOfficeBoxNumber],
      //     streetAddress: [spacepost.contactLocation.address.streetAddress],
      //     telephone: [spacepost.contactLocation.address.telephone],
      //     apartment: [spacepost.contactLocation.address.apartment],
      //     city: [spacepost.contactLocation.address.city],
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
    // return this.isRoute(['/AddSpacePost']);
    return !this.routeParams.get('id');
  }

  getSpacePost() {
    let isAddProfile = this.isAdd();
    if (isAddProfile) {
      this.spacepost = Object.assign({}, SpacePostStorage.get());

      //set featured image
      if (this.profileIdService.featuredImage.length > 0) {
        this.filesToUpload = [...this.profileIdService.featuredImage];
        this.featuredImage = URL.createObjectURL(this.profileIdService.featuredImage[0]);
        this.isFeaturedImage = true;
        this.profileIdService.unSetFeaturedImage();
      }
      else {
        this.isFeaturedImage = false;
      }

      if (this.profileIdService.additionalImage.length > 0) {
        this.multiFilesToUpload = [...this.profileIdService.additionalImage];
        this.isAdditionalImage = true;
        this.profileIdService.unSetAdditionalImage();
      }
      else {
        this.isAdditionalImage = false;
      }

      this.setFormValues(this.spacepost);
    } else {
      let id = this.routeParams.get('id');
      this.spacePostsService.get(id).subscribe(
        (response: SpacePostModel) => {
          this.spacepost = response;
          // TODO: go through each property of SpacePostStorage.get() 
          // and copy it if its value is defined
          // this.spacepost = Object.assign({}, response, SpacePostStorage.get());
          this.setFormValues(this.spacepost);
        },
        (error) => {
          console.log('ERROR ', error);
        }
      );
    }
  }

  saveOrUpdate(serializedForm: ISpacePost) {
    if (this.addressForms && this.addressForms.first) {
      // set space location
      let spaceLocation = this.addressForms.first.form.value.location;
      serializedForm.spaceLocation = spaceLocation;
    }
    if (this.addressForms && this.addressForms.last) {
      // set contact location
      let contactLocation = this.addressForms.last.form.value.location;
      serializedForm.contactLocation = contactLocation;
    }
    delete serializedForm.photosAndVideos;
    if (this.canSaveOrUpdate()) {
      this.spacePostsService[this.isAdd() ? 'save' : 'update'](serializedForm).subscribe(
        ((resp: SpacePostModel) => {
          this.isShowErrors = false;
          SpacePostStorage.invalidate();
          let msg = `Space Post has been saved!`;
          let activeProfile = this.appSrv.getActiveProfile();
          if (serializedForm.profile !== activeProfile['@id']) {
            /* tslint:disable */
            msg += ` Please select the ${serializedForm.organization} profile to see the space post you have just created!`;
            /* tslint:enable */
          }
          this.notificationsSvc.push(new NotificationModel({
            message: msg,
            type: 'success'
          }));
          if (this.isAdd()) {

            if (this.isFeaturedImage) {
              this.afUploader.setMediaToQueue(this.filesToUpload);
            }
            if (this.isAdditionalImage) {
              this.afMultiUploader.setMediaToQueue(this.multiFilesToUpload);
            }

            if (this.afUploader.getQueueSize() > 0) {
              setTimeout(() => this.afUploader.uploadFilesInQueue());
            }
            if (this.afMultiUploader.getQueueSize() > 0) {
              setTimeout(() => this.afMultiUploader.uploadFilesInQueue());
            }


            this.spacepost = resp;
            this.setFormValues(this.spacepost);
            this.paymentModal.opened = true;
            // trigger nr of spaceposts update - add to appService new post
            if (serializedForm.profile === activeProfile['@id']) {
              this.appSrv.addSelectedProfileSpacePost(this.spacepost);
            }
            Utils.scrollTop();
          } else {
            this.router.navigate(['/EditSpacePost', { 'id': SpacePostModel.extractId(resp['@id']) }]);
          }
        }).bind(this),
        ((resp) => {
          this.isShowErrors = false;
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving space post!`,
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
    let stored = SpacePostStorage.get() || {};
    delete stored.id;
    delete stored['@id'];
    return stored;
  }

  persistData(values = {}) {
    if (this.isAdd()) {
      let spacepost = Object.assign(this.getData(),
        (this.form && this.form.value) || {}, values || {});
      delete spacepost.id;
      delete spacepost['@id'];
      SpacePostStorage.set(spacepost);
      if (this.filesToUpload.length > 0) {
        this.profileIdService.setFeaturedImage(this.filesToUpload);
      }
      if (this.multiFilesToUpload.length > 0) {
        this.profileIdService.setAdditionalImage(this.multiFilesToUpload);
      }
    }
  }

  onPaymentSuccess($event) {
    console.log('onPaymentSuccess($event) ', $event);
  }

  onPaymentShareModalClose($event) {
    // console.log('onPaymentShareModalClose');
    // this.router.navigate(['/EditSpacePost',
    // { id: SpacePostModel.extractId(this.spacepost['@id']) }]);
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

  get isAutoUpload() {
    return false;
  }

  onFileChange($event?: any) {
    this.updateFilesToUpload(this.afUploader.ngFileSelect.uploader._queue);
    if (this.filesToUpload.length > 0) {
      this.profileIdService.setFeaturedImage(this.filesToUpload);
    }
  }

  updateFilesToUpload(files: any[] = []): void {
    this.filesToUpload = [...files];
  }


  onMultiFileChange($event?: any) {
    if (this.isAdditionalImage) {
      this.isAdditionalImage = false;
      this.afMultiUploader.setMediaToQueue(this.multiFilesToUpload);
    }
    this.updateMultiFilesToUpload(this.afMultiUploader.ngFileSelect.uploader._queue);
    if (this.multiFilesToUpload.length > 0) {
      this.profileIdService.setAdditionalImage(this.multiFilesToUpload);
    }
  }

  updateMultiFilesToUpload(files: any[] = []): void {
    this.multiFilesToUpload = [...files];
  }

  GetImage(data: any): string {
    return URL.createObjectURL(data);
  }

  onFileRemove($event, fIndex: number = 0) {
    $event.preventDefault();
    if (this.isAdditionalImage) {
      this.isAdditionalImage = false;
      this.afMultiUploader.setMediaToQueue(this.multiFilesToUpload);
    }
    this.afMultiUploader.ngFileSelect.uploader.removeFileFromQueue(fIndex);
    this.onMultiFileChange();
  }

  onMediaUploaded(uploadedItem: UploadModel) {
    console.log('onMediaUploaded ', uploadedItem);
    this.uploadedItems.push(uploadedItem);
    this.nrOfUploadedFiles++;
    if (this.nrOfUploadedFiles === this.filesToUpload.length) {
      console.log('Uploaded all files - trigger filesuploadedsuccess event');
    }
  }
}
