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
import {ISpacePost, SpacePostStorage, SpacePostModel} from '../models';
import {SpacePostsService} from '../../services/spaceposts-service';
import {SpacePostReplyForm} from './form/reply';
import {SpacePostReplyModel} from './models';
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
  selector: 'spacepost-reply-modal',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    Modal,
    Notification,
    SpacePostReplyForm
  ],
  providers: [SpacePostsService],
  pipes: [AsyncPipe],
  styles: [ require('./reply.css') ],
  template: require('./reply.html'),
  encapsulation: ViewEncapsulation.None
})
export class SpacePostReply implements OnInit, OnChanges {
  @Input() modal: IModal = {
    title: 'Send a reply to space post',
    hideOnClose: true,
  };
  @Input() spacepost: ISpacePost;
  @Output() onhide: EventEmitter<any> = new EventEmitter();
  @Output() replysuccess: EventEmitter<any> = new EventEmitter();
  profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel;
  profileId: string;
  notifications: Observable<NotificationModel[]>;
  @ViewChild(Modal) modalDialog;
  reply: SpacePostReplyModel = new SpacePostReplyModel();
  profileDisposable: Subscription<any>;
  successfullySaved: boolean = false;

  constructor(
    private router: Router,
    private routeParams: RouteParams,
    public notificationsSrv: NotificationsCollection,
    public appSrv: AppService,
    private spacePostsService: SpacePostsService
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
    // this.getSpacePost();
    let activeProfile = this.appSrv.getActiveProfile();
    this.profileId = activeProfile && activeProfile['@id'];
  }

  ngOnChanges(changes) {
  //   if (changes.modal) {
  //     this.modal = this.modal;
  //   }
  //   if (changes.spacepost) {
  //     this.spacepost = this.spacepost;
  //   }
  }

  getSpacePost() {
    let id = this.routeParams.get('id');
    if (id) {
      this.spacePostsService.get(id).subscribe(
        (response: ISpacePost) => {
          this.spacepost = new SpacePostModel(response);
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
