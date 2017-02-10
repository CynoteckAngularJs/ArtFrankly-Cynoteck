import {Component, Input, Output, EventEmitter, OnInit} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass
} from 'angular2/common';
import {Subscription} from 'rxjs/Subscription';
import {Profile} from '../../../../profiles/profile/profile';
import {FormatDatePipe} from '../../../../../url/pipes/pipes';
import {JobPostModel} from '../../models';
import {JobPostsService} from '../../../services/jobposts-service';
import {AppService, ACTIONS} from '../../../../authentication/services/app-service';
import {checkIfHasPermission} from '../../../../authentication/services/token-manager-service';
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
} from '../../../../profiles/models/profiles';
import {NotificationsCollection} from '../../../../notifications/services/notifications';
import {NotificationModel} from '../../../../notifications/notification/notification';
import {ReplyDetails} from '../../reply/details/reply';
import {MyJobPosts} from '../jobposts';
import {JobPostReplyModel} from '../../reply/models';
import {JOB_POST_STATES} from '../../../../../constants';
import {ProfileIdService} from '../../../../projects/services/projects-service';

@Component({
  selector: 'my-jobposts',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Profile, ReplyDetails],
  pipes: [FormatDatePipe],
  providers: [JobPostsService],
  styles: [ require('../jobposts.css') ],
  template: require('./myjobpostresponses.html')
})
@CanActivate(checkIfHasPermission)
export class MyJobPostsResponses extends MyJobPosts {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() jobposts: JobPostModel[] = [];
  @Input() archivedJobposts: JobPostModel[] = [];
  @Input() select: string;
  @Input() responses: JobPostReplyModel[] = [];
  myJobPosts$: Subscription<JobPostModel[]>;
  profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel;
  profileFieldType: string;
  profileFieldValue: string;
  // job post ids of all expanded jobposts
  expandedResponses: any = {};
  JOB_POST_STATES: any = JOB_POST_STATES;

  constructor(
      router: Router,
      location: Location,
      routeParams: RouteParams,
      jobpostsService: JobPostsService,
      appSrv: AppService,
      notificationsSvc: NotificationsCollection,
    ProfileIdService: ProfileIdService
  ) {
    super(router, location, routeParams,
      jobpostsService, appSrv, notificationsSvc, ProfileIdService);
  }

  ngOnInit() {}

  getMyJobPosts() {
    if (this.profileFieldType && this.profileFieldValue) {
      let profileQuery = { profile: this.profileFieldValue };
      this.jobpostsService.myJobPostsResponses(profileQuery)
        .subscribe(
          (response) => {
            this.responses = response['hydra:member'];
          }
        );
      // this.getArchivedJobPosts();
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

  // archiveJobPost($event, jobpost: JobPostModel) {
  //   $event.preventDefault();
  //   this.jobpostsService.archive(jobpost.id)
  //     .subscribe(
  //       (response) => {
  //         this.notificationsSvc.push(new NotificationModel({
  //             message: `Job Post has been archived!`,
  //             type: 'success'
  //           }));
  //         // TODO: remove jobpost item from the list
  //         let appState = this.appSrv.removeSelectedProfileJobPost(jobpost);
  //         this.jobposts = [...appState.selectedProfileJobPosts];
  //         this.getArchivedJobPosts();
  //       },
  //       (error) => {
  //         this.notificationsSvc.push(new NotificationModel({
  //           message: `Error has occured while archiving job post!`,
  //           type: 'danger'
  //         }));
  //         // Utils.scrollTop();
  //       }
  //     );
  // }


}
