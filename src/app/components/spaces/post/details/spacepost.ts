import { Component, Input, Output, EventEmitter, OnInit, OnChanges, ContentChild } from 'angular2/core';
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
  JsonPipe,
  AsyncPipe
} from 'angular2/common';
import { SpacePostsService } from '../../services/spaceposts-service';
import { ISpacePost, SpacePostStorage, SpacePostModel } from '../models';
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
import { SPACE_POST_STATES } from '../../../../constants';
import { SpacePostPaymentShareModal } from '../payment-share/modal';
import { Modal, IModal } from '../../../modal/modal';
import { SpacePostReply } from '../reply/reply';
import { FallbackImgDirective } from '../../../../url/components/fallbackimg';
import { FormatAddressPipe, SmarTextPipe, UrlCorectPipe, SortByDatePipe, ReversePipe, CommaPipe, FormatDatePipe } from '../../../../url/pipes/pipes';
import { Utils } from '../../../../url/utils/index';

import { Ng2OwlCarousel } from '../../../../url/components/ng2owlcarousel/ng2owlcarousel';
import { SlickCarousel } from '../../../../url/components/slickcarousel/slickcarousel';
import { ProfileIdService } from '../../../projects/services/projects-service';

@Component({
  selector: 'spacepost',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    SpacePostPaymentShareModal,
    SpacePostReply,
    FallbackImgDirective,

    Ng2OwlCarousel,
  ],
  providers: [SpacePostsService],
  pipes: [AsyncPipe, JsonPipe, FormatAddressPipe, SmarTextPipe, UrlCorectPipe, SortByDatePipe, ReversePipe, CommaPipe, FormatDatePipe],
  styles: [require('./spacepost.css'),
  require('../../../profiles/details/profile.css')],
  template: require('./spacepost.html')
})
// @CanActivate(checkIfHasPermission)
export class SpacePost implements OnInit, OnChanges {
  @Input() spacepost: ISpacePost = new SpacePostModel();
  profile: ProfileProfessionalModel | ProfileInstitutionModel | ProfileVendorModel;
  SPACE_POST_STATES: any = SPACE_POST_STATES;
  paymentModal: IModal = {
    title: 'Payment',
    hideOnClose: true,
    opened: false
  };
  replyModal: any = {
    title: 'Send a reply to space post',
    hideOnClose: true,
  };
  profileRouterLink: any[] = ['ProfilePreview', { id: undefined, type: undefined, uId: undefined }];
  DEFAULT_PROFILE_IMAGE: string;

  carouselOptions: any = {
    items: 1,
    center: true,
    nav: true,
    navRewind: true,
    navText: [
      '<span class=\'af-icon af-icon-xl icon-arrow-left\'></span>',
      '<span class=\'af-icon af-icon-xl icon-arrow-right\'></span>'
    ]
  };
  @ContentChild(Ng2OwlCarousel) owlCarousel;
  // Sections that are expanded
  expandedSections: any = {
    availableJobs: false,
    experiences: false,
    artists: false,
    licenses: false,
    events: false,
    honors: false,
  };
  mediaFiles: any = [];
  visibleItemsNumber: number = 5;

  multiFilesToUpload: any[] = [];
  profileImage: string = '';
  routerLink: any;

  isAdditionalImages: boolean = false;
  constructor(
    private builder: FormBuilder,
    private router: Router,
    private routeParams: RouteParams,
    private spacePostsService: SpacePostsService,
    public appSrv: AppService,
    public profileIdService: ProfileIdService
  ) {
    let selectedProfileDisposable = this.appSrv.$stream
      .map((state) => state.selectedProfile)
      .subscribe((profile) => {
        this.profile = BaseProfile.create(Object.assign({}, profile));
        this.getProfileLink();
      });
  }

  ngOnInit() {
    this.getSpacePost();
  }

  ngOnChanges(changes) {
    if (changes.spacepost && changes.spacepost.currentValue) {
      this.getProfileLink();
      this.setMediaFiles();
    }
  }

  getProfileLink() {
    let profile = this.isPreview ? this.profile : this.spacepost.deserializedProfile;
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

  getSpacePost() {
    let id = this.routeParams.get('uId') == null ? this.routeParams.get('id') : this.routeParams.get('uId');
    let featuredImage: any[] = [];
    let additionalImage: any[] = [];
    if (id === 'preview') {
      this.spacepost = new SpacePostModel(Object.assign({}, SpacePostStorage.get()));
      featuredImage = this.profileIdService.featuredImage;
      additionalImage = this.profileIdService.additionalImage;

      if (featuredImage.length > 0)
        this.DEFAULT_PROFILE_IMAGE = URL.createObjectURL(featuredImage[0]);

      if (additionalImage.length > 0) {
        this.isAdditionalImages = true;
        this.setAdditionalImageFiles(additionalImage);
      }
      else {
        this.isAdditionalImages = false;
      }


    } else {
      if (id.indexOf('=') > -1)
        id = id.split('=')[1];
      this.spacePostsService.get(id).subscribe(
        (response: ISpacePost) => {
          this.spacepost = new SpacePostModel(response);
          this.setMediaFiles();
          this.getProfileLink();
        },
        (error) => {
          console.log('ERROR ', error);
        }
      );
    }
    /* tslint:disable */
    let activeProfile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel = this.appSrv.getActiveProfile();
    if (featuredImage.length == 0)
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

  isVideo(fileFormat: string) {
    return Utils.isVideoFormat(fileFormat);
  }

  setMediaFiles() {
    let mediaFiles = [];
    if (this.spacepost) {
      mediaFiles = [
        ...this.spacepost.photosAndVideos || []
      ];
    }
    this.mediaFiles = mediaFiles;
    this.carouselOptions.nav = mediaFiles.length > 1;
    // if (this.owlCarousel && mediaFiles.length <= 1) {
    //   this.owlCarousel.hideCarousel();
    // }
  }

  setAdditionalImageFiles(file: any[]) {
    let mediaFiles = [...file];
    this.mediaFiles = mediaFiles;
    this.carouselOptions.nav = mediaFiles.length > 1;
  }

  GetImage(data: any): string {
    return URL.createObjectURL(data);
  }
}
