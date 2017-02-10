import {Observable} from 'rxjs/Observable';
import {Component, ViewEncapsulation, OnInit} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {Signup} from './signup';
import {Modal, IModal} from '../../modal/modal';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../notifications/notification/notification';

@Component({
  selector: 'signup',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Signup, Modal, Notification],
  providers: [],
  pipes: [AsyncPipe],
  // styles: [ require('./signinmodal.css') ],
  template: require('./signupmodal.html'),
  encapsulation: ViewEncapsulation.None
})
export class SignupModal implements OnInit {
  modal: IModal = {
    title: 'Sign Up',
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
    console.log('onClose: ', $event);
    this.modal.opened = false;
    // if (this.ref) {
    //   this.router.navigateByUrl(this.ref);
    // } else {
      this.router.navigate(['/Home']);
    // }
  }
}
