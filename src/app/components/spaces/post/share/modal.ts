import {Observable} from 'rxjs/Observable';
import {Component, Input, Output, ViewEncapsulation, OnInit, ViewChild} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
// import {Signin} from './signin';
import {Modal, IModal} from '../../../modal/modal';
import {NotificationsCollection} from '../../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../../notifications/notification/notification';
import {ISpacePost, SpacePostStorage, SpacePostModel} from '../models';

@Component({
  selector: 'spacepost-share-modal',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Modal, Notification],
  providers: [],
  pipes: [AsyncPipe],
  // styles: [ require('./signinmodal.css') ],
  template: require('./modal.html'),
  encapsulation: ViewEncapsulation.None
})
export class SpacePostSharetModal implements OnInit {
  modal: IModal = {
    title: 'Share'
  };
  @Input() spacepost: ISpacePost;
  notifications: Observable<NotificationModel[]>;
  @ViewChild(Modal) modalDialog;

  constructor(
    private router: Router,
    public notificationsSrv: NotificationsCollection
  ) {}

  ngOnInit() {
    this.notifications = this.notificationsSrv.$stream;
    let DEFAULTS = { contactLocation: { address: {} }, spaceLocation: { address: {} } };
    this.spacepost = Object.assign({}, DEFAULTS, this.spacepost);
  }

  close($event) {
    this.modalDialog.onClose($event);
  }

  onClose($event) {
    console.log('onClose: ', $event);
    // this.router.navigate(['/Home']);
  }
}
