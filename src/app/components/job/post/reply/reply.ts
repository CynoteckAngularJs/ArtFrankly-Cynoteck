import {Observable} from 'rxjs/Observable';
import {Component,
  Input,
  Output,
  ViewEncapsulation,
  OnInit,
  OnChanges,
  EventEmitter,
  ViewChild
} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {Subscription} from 'rxjs/Subscription';
// import {Signin} from './signin';
import {Modal, IModal} from '../../../modal/modal';
import {NotificationsCollection} from '../../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../../notifications/notification/notification';
import {IJobPost, JobPostStorage, JobPostModel} from '../models';
import {JobPostsService} from '../../services/jobposts-service';
import {JobPostReplyForm} from './form/reply';
import {JobPostReplyModel} from './models';
import {
  IProfileEditLD,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel,
  BaseProfile
} from '../../../profiles/models/profiles';
import {AppService, ACTIONS} from '../../../authentication/services/app-service';

@Component({
  selector: 'jobpost-reply-modal',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    Modal,
    Notification,
    JobPostReplyForm
  ],
  providers: [JobPostsService],
  pipes: [AsyncPipe],
  styles: [ require('./reply.css') ],
  template: require('./reply.html'),
  encapsulation: ViewEncapsulation.None
})
export class JobPostReply implements OnInit, OnChanges {
  @Input() modal: IModal = {
    title: 'Send a reply to job post',
    hideOnClose: true,
  };
  @Input() jobpost: IJobPost;
  @Output() onhide: EventEmitter<any> = new EventEmitter();
  @Output() replysuccess: EventEmitter<any> = new EventEmitter();
  profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel;
  profileId: string;
  notifications: Observable<NotificationModel[]>;
  @ViewChild(Modal) modalDialog;
  reply: JobPostReplyModel = new JobPostReplyModel();
  profileDisposable: Subscription<any>;
  successfullySaved: boolean = false;

  constructor(
    private router: Router,
    private routeParams: RouteParams,
    public notificationsSrv: NotificationsCollection,
    public appSrv: AppService,
    private jobPostsService: JobPostsService
  ) {
    // TODO: Do we need this? I think not!
    this.profileDisposable = this.appSrv.$stream
      .filter((state) => state.action === ACTIONS.PROFILE_SELECTED)
      .map((state) => state.selectedProfile)
      .subscribe((profile) => {
        console.log('PROFILE RETREIVED ', profile);
        this.profile = profile;
        this.profileId = this.profile && this.profile['@id'];
      });
  }

  ngOnInit() {
    // this.getJobPost();
    let activeProfile = this.appSrv.getActiveProfile();
    this.profileId = activeProfile && activeProfile['@id'];
  }

  ngOnChanges(changes) {
  //   if (changes.modal) {
  //     this.modal = this.modal;
  //   }
  //   if (changes.jobpost) {
  //     this.jobpost = this.jobpost;
  //   }
  }

  getJobPost() {
    let id = this.routeParams.get('id');
    if (id) {
      this.jobPostsService.get(id).subscribe(
        (response: IJobPost) => {
          this.jobpost = new JobPostModel(response);
        },
        (error) => {
          console.log('ERROR ', error);
        }
      );
    }
  }

  close($event) {
    this.modalDialog.onClose($event);
  }

  onClose($event) {
    console.log('onClose: ', $event);
    // this.router.navigate(['/Home']);
  }

  onHide($event?: any) {
    this.successfullySaved = false;
    this.onhide.next($event);
  }

  onReplySentHide($event) {
    $event.preventDefault();
    this.onHide();
  }

  onReplySaved($event) {
    console.log('onReplySaved($event) ', $event);
    this.replysuccess.next($event);
    this.successfullySaved = true;
  }
}
