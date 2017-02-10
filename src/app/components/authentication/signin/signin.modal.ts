import {Observable} from 'rxjs/Observable';
import {Component, ViewEncapsulation, OnInit} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {Signin} from './signin';
import {Modal, IModal} from '../../modal/modal';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../notifications/notification/notification';

@Component({
  selector: 'signin',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Signin, Modal, Notification],
  providers: [],
  pipes: [AsyncPipe],
  // styles: [ require('./signinmodal.css') ],
  template: require('./signinmodal.html'),
  encapsulation: ViewEncapsulation.None
})
export class SigninModal implements OnInit {
  modal: IModal = {
    title: 'Sign In',
    hideOnClose: true,
    opened: true
  };
  notifications: Observable<NotificationModel[]>;

  constructor(
    private router: Router,
    private routeParams: RouteParams,
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

  get ref() {
    return this.routeParams.get('ref');
  }
}
