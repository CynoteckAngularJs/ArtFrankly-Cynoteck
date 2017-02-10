import { Component, ViewChild, Input, Output, EventEmitter, OnInit } from 'angular2/core';
import { ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate } from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass
} from 'angular2/common';
import { Subscription } from 'rxjs/Subscription';
import { Profile } from '../../../profiles/profile/profile';
import { FormatDatePipe } from '../../../../url/pipes/pipes';
import { JobPostModel } from '../models';
import { JobPostsService } from '../../services/jobposts-service';
import { AppService, ACTIONS } from '../../../authentication/services/app-service';
import { checkIfHasPermission } from '../../../authentication/services/token-manager-service';
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
import { NotificationsCollection } from '../../../notifications/services/notifications';
import { Notification, NotificationModel } from '../../../notifications/notification/notification';
import { ReplyDetails } from '../reply/details/reply';
import { Utils } from '../../../../url/utils/index';
import { JOB_POST_STATES } from '../../../../constants';
import { FeedFilterButtonGroup } from '../../../feed/filter/general/filter';
import { FeedsService } from '../../../feed/services/feeds-service';

import { FeedModel, IFeedFilter } from '../../../feed/models';
import { SearchService } from '../../../search/services/search-service';
import { FeedJobPostDetails } from '../../../feed/details/jobpost/index';
import { FeedFilter } from '../../../feed/filter/filter';
import { ProfileIdService } from '../../../projects/services/projects-service';

declare var jQuery: any;

@Component({
  selector: 'my-landing',
  directives: [...ROUTER_DIRECTIVES,
    NgClass,
    FeedFilter,
    Profile,
    ReplyDetails,
    FeedFilterButtonGroup,
    FeedJobPostDetails,
    Notification],
  pipes: [FormatDatePipe],
  providers: [JobPostsService, FeedsService, SearchService],
  styles: [require('./job-landing.css')],
  template: require('./job-landing.html')
})
@CanActivate(checkIfHasPermission)
export class MyLanding implements OnInit {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() mylanding: JobPostModel[] = [];
  @Input() archivedJobposts: JobPostModel[] = [];
  @Input() select: string;
  @Output() filterchange: EventEmitter<any> = new EventEmitter();
  lastAppliedFilter: IFeedFilter;
  @Input() feeds: FeedModel[] = [];
  myJobPosts$: Subscription<JobPostModel[]>;
  profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel;
  profileFieldType: string;
  profileFieldValue: string;
  // job post ids of all expanded jobposts
  expandedResponses: any = {};
  JOB_POST_STATES: any = JOB_POST_STATES;
  searchTerm: string;
  total: number;
  selectedType: string;
  nextPage: string;
  selectedFeed: string;
  constructor(
    public router: Router,
    public location: Location,
    public routeParams: RouteParams,
    public jobpostsService: JobPostsService,
    public appSrv: AppService,
    private searchService: SearchService,
    private notificationsSvc: NotificationsCollection,
    public ProfileIdService: ProfileIdService
  ) {
    let selectedProfileDisposable = this.appSrv.$stream
      .map((state) => state.selectedProfile)
      .subscribe((profile) => this.onProfileUpdate(profile));
  }

  onFilterChange($event: IFeedFilter = {}) {
    this.ProfileIdService.setSearchFeed($event);
    let type = $event.type.indexOf('job') > -1 ? 'JOBS' : $event.type.indexOf('space') > -1 ? 'SPACES' : $event.type.indexOf('profile') > -1 ? 'PROFILES' : '';
    this.ProfileIdService.setSelectedFeed(type);
    this.router.navigate(['/Feeds']);
    //this.applyFilter($event.term, $event);
  }

  onProfileUpdate(profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel) {
    if (profile) {
      let myProfileQuery = profile.getMyProfileQuery();
      this.profileFieldType = myProfileQuery.type;
      this.profileFieldValue = myProfileQuery.value;
      this.getMyJobPosts();
    }
  }

  ngOnInit() {
    this.ProfileIdService.unSetFeaturedImage();
    this.ProfileIdService.unSetAdditionalImage();
  }

  getMyJobPostsHandler($event) {
    $event.preventDefault();
    this.getMyJobPosts();
  }

  getMyJobPosts() {
    if (this.profileFieldType && this.profileFieldValue) {
      this.jobpostsService.myJobPosts(this.profileFieldType, this.profileFieldValue)
        .subscribe(
        (response) => {
          this.mylanding = response['hydra:member'];
        }
        );
      this.getArchivedJobPosts();
    }
  }

  getArchivedJobPosts() {
    if (this.profileFieldValue) {
      this.jobpostsService.profileArchivedJobPosts(this.profileFieldValue)
        .subscribe(
        (response) => {
          this.archivedJobposts = response['hydra:member'];
        }
        );
    }
  }

  archiveJobPost($event, jobpost: JobPostModel) {
    $event.preventDefault();
    this.jobpostsService.archive(jobpost.id)
      .subscribe(
      (response) => {
        this.notificationsSvc.push(new NotificationModel({
          message: `Job Post has been archived!`,
          type: 'success'
        }));
        // TODO: remove jobpost item from the list
        let appState = this.appSrv.removeSelectedProfileJobPost(jobpost);
        this.mylanding = [...appState.selectedProfileJobPosts];
        this.getArchivedJobPosts();
      },
      (error) => {
        this.notificationsSvc.push(new NotificationModel({
          message: `Error has occured while archiving job post!`,
          type: 'danger'
        }));
        // Utils.scrollTop();
      });
  }

  attachComingSoonNotifications() {
    jQuery('#spaces-link a').on('click', (e) => this.comingSoon(e));
    jQuery('#commissions-link a').on('click', (e) => this.comingSoon(e));
  }

  deAttachComingSoonNotifications() {
    jQuery('#spaces-link a').off('click', (e) => this.comingSoon(e));
    jQuery('#commissions-link a').off('click', (e) => this.comingSoon(e));

    jQuery('aside li a').off('click', (e) => console.log('clicked li a'));
  }

  comingSoon($event) {
    $event.preventDefault();
    this.notificationsSvc.push(new NotificationModel({
      message: `Coming Soon!`,
      type: 'success'
    }));
  }


  toggleAllResponses(jobpostId, $event) {
    $event.preventDefault();
    this.expandedResponses[jobpostId] = !!!this.expandedResponses[jobpostId];
  }

  goToArchived($event) {
    $event.preventDefault();
    Utils.scrollTo('#archivedJobPosts');
  }

  onPublish($event, jobpost: JobPostModel) {
    $event.preventDefault();
    if (jobpost.id) {
      this.jobpostsService.publish(jobpost.id).subscribe(
        (response) => {
          jobpost.state = response.state;
        }
      );
    }
  }
}
