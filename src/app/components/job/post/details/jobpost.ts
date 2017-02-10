import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from 'angular2/core';
import { Observable } from 'rxjs/Observable';
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
  NgStyle,
  JsonPipe,
  AsyncPipe
} from 'angular2/common';
import { JobPostsService } from '../../services/jobposts-service';
import { IJobPost, JobPostStorage, JobPostModel } from '../models';
import { AppService, IApp, DEFAULTS, ACTIONS } from '../../../authentication/services/app-service';
import {
  IProfileEditLD,
  ProfileEditLDModel,
  ProfileProfessionalModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  IInstitutionGeneral,
  IVendorGeneral,
  IProfessionalGeneral,
  BaseProfile
} from '../../../profiles/models/profiles';
import { JOB_POST_STATES } from '../../../../constants';
import { JobPostPaymentShareModal } from '../payment-share/modal';
import { Modal, IModal } from '../../../modal/modal';
import { JobPostReply } from '../reply/reply';
import { FallbackImgDirective } from '../../../../url/components/fallbackimg';
import { FormatAddressPipe, SmarTextPipe, UrlCorectPipe } from '../../../../url/pipes/pipes';
import { Utils } from '../../../../url/utils/index';

@Component({
  selector: 'jobpost',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    NgStyle,
    JobPostPaymentShareModal,
    JobPostReply,
    FallbackImgDirective
  ],
  providers: [JobPostsService],
  pipes: [AsyncPipe, JsonPipe, FormatAddressPipe, SmarTextPipe, UrlCorectPipe],
  styles: [require('./jobpost.css'),
  require('../../../profiles/details/profile.css')],
  template: require('./jobpost.html')
})
// @CanActivate(checkIfHasPermission)
export class JobPost implements OnInit, OnChanges {
  @Input() jobpost: IJobPost = new JobPostModel();
  profile: ProfileProfessionalModel | ProfileInstitutionModel | ProfileVendorModel;
  JOB_POST_STATES: any = JOB_POST_STATES;
  paymentModal: IModal = {
    title: 'Payment',
    hideOnClose: true,
    opened: false
  };
  replyModal: any = {
    title: 'Send a reply to job post',
    hideOnClose: true,
  };
  routerLink: any;
  // profileRouterLink: any[] = ['ProfilePreview', { id: undefined, type: undefined }];
  profileRouterLink: any[] = ['ProfilePreview', { id: undefined, type: undefined, uId: undefined }];
  DEFAULT_PROFILE_IMAGE: string;

  constructor(
    private builder: FormBuilder,
    private router: Router,
    private routeParams: RouteParams,
    private jobPostsService: JobPostsService,
    public appSrv: AppService
  ) {
    let selectedProfileDisposable = this.appSrv.$stream
      .map((state) => state.selectedProfile)
      .subscribe((profile) => {
        this.profile = BaseProfile.create(Object.assign({}, profile));
        this.getProfileLink();
      });
  }

  ngOnInit() {
    this.getJobPost();
  }

  ngOnChanges(changes) {
    if (changes.jobpost && changes.jobpost.currentValue) {
      this.getProfileLink();
    }
  }

  // getProfileLink() {
  //   let profile = this.isPreview ? this.profile : this.jobpost.deserializedProfile;
  //   return this.profileRouterLink = [
  //       'ProfilePreview',
  //       {
  //         id: profile.id || '',
  //         type: profile.type || ''
  //       }
  //     ];
  // }
  getProfileLink() {
    let profile = this.isPreview ? this.profile : this.jobpost.deserializedProfile;
    // return this.profileRouterLink = [
    //   'ProfilePreview',
    //   {
    //     id: profile.name ? profile.name.trim().replace(/[^A-Za-z0-9]+/g, '-') : (profile.givenName + ' ' + profile.familyName).trim().replace(/[^A-Za-z0-9]+/g, '-') || '',
    //     type: profile.type || '',
    //     uId: profile.id || ''
    //   }
    // ];
    let routerLinkArray = [];
    let profileName = profile.name ? profile.name.trim().replace(/[^A-Za-z0-9]+/g, '-') : (profile.givenName + ' ' + profile.familyName).trim().replace(/[^A-Za-z0-9]+/g, '-');
    routerLinkArray[0] = 'ProfilePreview';
    routerLinkArray[1] = { type: profile.type, id: profileName.replace(/[^A-Za-z0-9]+/g, '-') + '?uId=' + profile.id };
    routerLinkArray[2] = profile.id;
    this.routerLink = routerLinkArray;
  }
  getJobPost() {
    let id = this.routeParams.get('uId') != null ? this.routeParams.get('uId') : (this.routeParams.get('id').indexOf('=') > -1) ? this.routeParams.get('id').split('=')[1] : this.routeParams.get('id');
    if (id === 'preview') {
      this.jobpost = new JobPostModel(Object.assign({}, JobPostStorage.get()));
    } else {
      this.jobPostsService.get(id).subscribe(
        (response: IJobPost) => {
          this.jobpost = new JobPostModel(response);
          this.getProfileLink();
        },
        (error) => {
          console.log('ERROR ', error);
        }
      );
    }
    /* tslint:disable */
    let activeProfile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel = this.appSrv.getActiveProfile();
    this.DEFAULT_PROFILE_IMAGE = activeProfile && activeProfile.image && activeProfile.image.contentUrl;
    /* tslint:enable */
  }

  onReply($event) {
    $event.preventDefault();
    this.replyModal.opened = true;
  }

  onReplyModalHide($event) {
    this.replyModal.opened = false;
  }

  showPaymentShareModal($event) {
    $event.preventDefault();
    this.paymentModal.opened = true;
  }

  onPaymentShareModalHide($event) {
    this.paymentModal.opened = false;
  }

  onPaymentShareModalSuccess($event) {
    console.log('onPaymentShareModaSuccess($event) ', $event);
  }

  hasAddress(address: any) {
    return !Utils.isAddressEmpty(address);
  }

  get isPreview() {
    return this.routeParams.get('id') === 'preview';
  }
}
