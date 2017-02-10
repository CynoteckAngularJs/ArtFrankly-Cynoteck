import {Observable} from 'rxjs/Observable';
import {Component, ViewEncapsulation, OnInit} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {RequestEmail} from './request';
import {Modal, IModal} from '../../modal/modal';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../notifications/notification/notification';

@Component({
  selector: 'signin',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, RequestEmail, Modal, Notification],
  providers: [],
  pipes: [AsyncPipe],
  template: require('./requestmodal.html'),
  encapsulation: ViewEncapsulation.None
})
export class RequestEmailModal implements OnInit {
  modal: IModal = {
    title: 'Reset Password',
    hideOnClose: true,
    opened: true
  };
  notifications: Observable<NotificationModel[]>;

  constructor(
    private router: Router,
    public notificationsSrv: NotificationsCollection
  ) {}

  ngOnInit() {
    this.notifications = this.notificationsSrv.$stream;
  }

  onClose($event) {
    this.modal.opened = false;
    this.router.navigate(['/Home']);
  }
}

