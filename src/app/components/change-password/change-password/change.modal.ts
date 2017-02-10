import {Observable} from 'rxjs/Observable';
import {Component, ViewEncapsulation, OnInit} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {ChangePassword} from './change';
import {Modal, IModal} from '../../modal/modal';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {
    Notification,
    NotificationModel
} from '../../notifications/notification/notification';
import {ROUTES, NOTIFICATION_TAGS} from '../../../constants';

@Component({
    selector: 'signin',
    directives: [ ...ROUTER_DIRECTIVES, NgClass, ChangePassword, Modal, Notification],
    providers: [],
    pipes: [AsyncPipe],
    template: require('./changemodal.html'),
    encapsulation: ViewEncapsulation.None
})
export class ChangePasswordModal implements OnInit {
    modal: IModal = {
        title: 'Change Password'
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
        this.router.navigate(['/Feeds']);
    }
}

