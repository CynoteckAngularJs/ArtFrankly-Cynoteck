import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  AfterViewInit,
  ContentChild
} from 'angular2/core';
import { ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate } from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  NgStyle,
  JsonPipe,
  NgSwitch,
  NgSwitchWhen,
  NgSwitchDefault
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
import { Subscription } from 'rxjs/Subscription';
import { AppService, ACTIONS } from '../../authentication/services/app-service';
import { NotificationsCollection } from '../../notifications/services/notifications';
import { NotificationModel } from '../../notifications/notification/notification';
import { checkIfHasPermission } from '../../authentication/services/token-manager-service';
import { ProfilesService } from '../services/profiles-service';
import { JobPostModel } from '../../job/post/models';
import { SpacePostModel } from '../../spaces/post/models';
import { JobPostsService } from '../../job/services/jobposts-service';
import { Utils } from '../../../url/utils/index';
import {
  FormatDatePipe,
  FormatAddressPipe,
  CommaPipe,
  SmarTextPipe,
  ReversePipe,
  SortByDatePipe,
  UrlCorectPipe
} from '../../../url/pipes/pipes';
import { Ng2OwlCarousel } from '../../../url/components/ng2owlcarousel/ng2owlcarousel';
import { SlickCarousel } from '../../../url/components/slickcarousel/slickcarousel';
import { FallbackImgDirective } from '../../../url/components/fallbackimg';
import { FeedFilterButtonGroup } from '../../feed/filter/general/filter';
import { ActiveProfileJobPostsNumber } from '../../job/jobpostsnumber';
import { ProfileIdService } from '../../projects/services/projects-service';
import { FeedModel, IFeedFilter } from '../../feed/models';
import { SpacePostsService } from '../../spaces/services/spaceposts-service';

@Component({
  selector: 'profile-preview',
  directives: [...ROUTER_DIRECTIVES,
    NgClass,
    NgStyle,
    Ng2OwlCarousel,
    FallbackImgDirective,
    FeedFilterButtonGroup,
    ActiveProfileJobPostsNumber
  ],
  providers: [ProfilesService, JobPostsService, SpacePostsService],
  pipes: [
    JsonPipe,
    FormatDatePipe,
    FormatAddressPipe,
    CommaPipe,
    SmarTextPipe,
    ReversePipe,
    SortByDatePipe,
    UrlCorectPipe
  ],
  styles: [require('./profile.css')],
  template: require('./profile.html')
})
@CanActivate(checkIfHasPermission)
export class ProfilePreview implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  /* tslint:disable */
  @Input() profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel = new ProfileProfessionalModel();
  mediaFiles: any = [];
  /* tslint:enable */
  @Input() jobposts: JobPostModel[] = [];
  @Input() spaceposts: SpacePostModel[] = [];
  profileFieldType: string;
  profileFieldValue: string;
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
    availableSpaces: false,
    experiences: false,
    artists: false,
    licenses: false,
    events: false,
    honors: false,
  };
  visibleItemsNumber: number = 5;

  constructor(
    private router: Router,
    private location: Location,
    private routeParams: RouteParams,
    private profileService: ProfilesService,
    private jobpostsService: JobPostsService,
    private spacePostsService: SpacePostsService,
    public appSrv: AppService,
    private notificationsSvc: NotificationsCollection,
    public ProfileIdService: ProfileIdService
  ) { }

  ngOnInit() {
    this.profileFieldValue = this.routeParams.get('uId') != null ? this.routeParams.get('uId') : (this.routeParams.get('id').indexOf('=') > -1) ? this.routeParams.get('id').split('=')[1] : this.routeParams.get('id');
    this.getProfile();
  }

  ngAfterViewInit() { }

  ngOnChanges(changes) {
    if (changes.profile && changes.profile.currentValue) {
      this.setMediaFiles();
    }
  }

  onFilterChange($event: IFeedFilter = {}) {
    this.ProfileIdService.setSearchFeed($event);
    let type = $event.type.indexOf('job') > -1 ? 'JOBS' : $event.type.indexOf('space') > -1 ? 'SPACES' : $event.type.indexOf('profile') > -1 ? 'PROFILES' : '';
    this.ProfileIdService.setSelectedFeed(type);
    this.router.navigate(['/Feeds']);
    //this.applyFilter($event.term, $event);
  }

  ngOnDestroy() { }

  /**
   * typeApi = "institution"
   */
  getProfileIRI() {
    //let uId = this.routeParams.get('uId');
    console.log(this.profile);
    let typeApi: string = this.routeParams.get('type');
    //alert('Id is: ' + this.routeParams.get('uId'));
    return this.profile['@id'] ?
      this.profile['@id'] :
      [
        Utils.typeToApiType(this.routeParams.get('type')),
        this.profileFieldValue//this.routeParams.get('id')
      ].join('/');
    // alert('refresh');
    // alert(this.ProfileIdService.flag)
    // if(this.ProfileIdService.flag)
    // {
    //   let typeApi : string = this.routeParams.get('type');
    // return this.profile['@id'] ?
    //   this.profile['@id'] :
    //   [
    //     Utils.typeToApiType(this.routeParams.get('type')),
    //     this.routeParams.get('id')
    //   ].join('/');
    // }
    // else{
    //   let typeApi : string = this.routeParams.get('type');
    //   alert(typeApi);
    // return this.profile['@id'] ?
    //   this.profile['@id'] :
    //   [
    //     Utils.typeToApiType(this.routeParams.get('type')),
    //     this.profileFieldValue
    //   ].join('/');
    // }
  }

  /**
   * profileIri = "institutions/3"
   */
  getProfile() {
    let profileIri: string = this.getProfileIRI();
    this.profileService.preview(profileIri)
      .subscribe(
      (response: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel) => {
        this.profile = response;
        this.setMediaFiles();
        this.getMyJobPosts();
        this.getMySpacePosts();
      },
      (error) => {
        console.log('ERROR ', error);
      }
      );
  }

  /**
   * profileFieldType = 'hiringProfessional'
   * profileFieldValue = 12
   */
  getMyJobPosts() {
    let myProfileQuery = this.profile.getMyProfileQuery();
    this.profileFieldType = myProfileQuery.type;
    if (this.profileFieldType && this.profileFieldValue) {
      this.jobpostsService.myPublishedJobPosts(this.profileFieldType, this.profileFieldValue)
        .subscribe(
        (response) => {
          this.jobposts = response['hydra:member'];
        }
        );
    }
  }

  getMySpacePosts() {
    let myProfileQuery = this.profile.getMyProfileQuery();
    this.profileFieldType = myProfileQuery.type;
    if (this.profileFieldType && this.profileFieldValue) {
      this.spacePostsService.myPublishedSpacePosts(this.profileFieldType, this.profileFieldValue)
        .subscribe(
        (response) => {
          this.spaceposts = response['hydra:member'];
        }
        );
    }
  }

  setJobPostRouteValue(title: string, id: number): string {
    return '';
  }

  isVideo(fileFormat: string) {
    return Utils.isVideoFormat(fileFormat);
  }

  setMediaFiles() {
    let mediaFiles = [];
    if (this.profile) {
      mediaFiles = [
        ...this.profile.artworks || [],
        ...this.profile.photosAndVideos || []
      ];
    }
    this.mediaFiles = mediaFiles;
    this.carouselOptions.nav = mediaFiles.length > 1;
    // if (this.owlCarousel && mediaFiles.length <= 1) {
    //   this.owlCarousel.hideCarousel();
    // }
  }

  comingSoon($event) {
    $event.preventDefault();

    this.notificationsSvc.push(new NotificationModel({
      message: `Coming soon!`,
      type: 'info'
    }));
  }

  toggleExpanding($event, sectionName: string) {
    $event.preventDefault();
    this.expandedSections[sectionName] = !this.expandedSections[sectionName];
  }

  hasAddress(address: any) {
    return !Utils.isAddressEmpty(address);
  }

  replaceChar(str: string) {
    return str.trim().replace(/[^A-Za-z0-9]+/g, '-')
  }
}
