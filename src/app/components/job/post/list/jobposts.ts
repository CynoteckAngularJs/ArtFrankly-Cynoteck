import { Component, Input, Output, EventEmitter, OnInit } from 'angular2/core';
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
import { NotificationModel } from '../../../notifications/notification/notification';
import { ReplyDetails } from '../reply/details/reply';
import { Utils } from '../../../../url/utils/index';
import { JOB_POST_STATES } from '../../../../constants';
import { FeedFilterButtonGroup } from '../../../feed/filter/general/filter';
import { ProfileIdService } from '../../../projects/services/projects-service';
import { FeedModel, IFeedFilter } from '../../../feed/models';
import { JobPostReplyModel, IJobPostReply } from '../../post/reply/models';

@Component({
  selector: 'my-jobposts',
  directives: [...ROUTER_DIRECTIVES, NgClass, Profile, ReplyDetails, FeedFilterButtonGroup],
  pipes: [FormatDatePipe],
  providers: [JobPostsService],
  styles: [require('./jobposts.css')],
  template: require('./jobposts.html')
})
@CanActivate(checkIfHasPermission)
export class MyJobPosts implements OnInit {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() jobposts: JobPostModel[] = [];
  @Input() archivedJobposts: JobPostModel[] = [];
  @Input() jobPostReplyModel: JobPostReplyModel[] = [];
  @Input() select: string;
  myJobPosts$: Subscription<JobPostModel[]>;
  profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel;
  profileFieldType: string;
  profileFieldValue: string;
  // job post ids of all expanded jobposts
  expandedResponses: any = {};
  JOB_POST_STATES: any = JOB_POST_STATES;

  constructor(
    public router: Router,
    public location: Location,
    public routeParams: RouteParams,
    public jobpostsService: JobPostsService,
    public appSrv: AppService,
    public notificationsSvc: NotificationsCollection,
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

  replaceChar(str: string) {
    return str.trim().replace(/[^A-Za-z0-9]+/g, '-')
  }

  onProfileUpdate(profile: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel) {
    if (profile) {
      let myProfileQuery = profile.getMyProfileQuery();
      this.profileFieldType = myProfileQuery.type;
      this.profileFieldValue = myProfileQuery.value;
      this.getMyJobPosts();
    }
  }

  ngOnInit() { }

  getMyJobPostsHandler($event) {
    $event.preventDefault();
    this.getMyJobPosts();
  }

  getMyJobPosts() {
    if (this.profileFieldType && this.profileFieldValue) {
      this.jobpostsService.myJobPosts(this.profileFieldType, this.profileFieldValue)
        .subscribe(
        (response) => {
          this.jobposts = response['hydra:member'];
        }
        );
      this.getArchivedJobPosts();
      this.getMyJobPostsResponses();
    }
  }

  getMyJobPostsResponses() {
    if (this.profileFieldType && this.profileFieldValue) {
      this.jobpostsService.myJobPostsResponses({ profile: this.profileFieldValue })
        .subscribe(
        (response) => {
          this.jobPostReplyModel = response['hydra:member'];
        }
        );
    }
    console.log("JobPostReplyModel: " + this.jobPostReplyModel);
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
        this.jobposts = [...appState.selectedProfileJobPosts];
        this.getArchivedJobPosts();
      },
      (error) => {
        this.notificationsSvc.push(new NotificationModel({
          message: `Error has occured while archiving job post!`,
          type: 'danger'
        }));
        // Utils.scrollTop();
      }
      );
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

  createRouterLink(jobpost: JobPostModel, title: string) {
    let routerLinkArray = [];
    routerLinkArray[0] = 'JobPost';
    routerLinkArray[1] = { id: title.trim().replace(/[^A-Za-z0-9]+/g, '-') + '?uId=' + jobpost.id };
    routerLinkArray[2] = jobpost.id;
    return routerLinkArray;
  }

  editJob($event, title: string, id: string) {
    $event.preventDefault();
    this.router.navigate(['EditJobPost', { id: title.trim().replace(/[^A-Za-z0-9]+/g, '-'), uId: id }]);
  }
}
