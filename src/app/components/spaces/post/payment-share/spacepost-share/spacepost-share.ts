import {Observable} from 'rxjs/Observable';
import {
  Component,
  Input,
  Output,
  ViewEncapsulation,
  OnInit,
  ViewChild,
  EventEmitter
} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {NotificationsCollection} from '../../../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../../../notifications/notification/notification';
import {ISpacePost, SpacePostStorage, SpacePostModel} from '../../models';

declare var fbq: any;

@Component({
  selector: 'spacepost-share',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Notification],
  providers: [],
  pipes: [AsyncPipe],
  // styles: [ require('./spacepost-share.css') ],
  template: require('./spacepost-share.html'),
  encapsulation: ViewEncapsulation.None
})
export class SpacePostShare implements OnInit {
  @Input() spacepost: ISpacePost;
  @Output() shared: EventEmitter<any> = new EventEmitter();
  notifications: Observable<NotificationModel[]>;

  constructor(
    private router: Router,
    public notificationsSrv: NotificationsCollection
  ) {}

  ngOnInit() {
    this.notifications = this.notificationsSrv.$stream;
    let DEFAULTS = { contactLocation: { address: {} }, spaceLocation: { address: {} } };
    this.spacepost = Object.assign({}, DEFAULTS, this.spacepost);

    fbq('track', 'Purchase', {value: '0.00', currency: 'USD'});
  }

  triggerShared($event) {
    $event.preventDefault();
    this.shared.next({});
  }

  onCancel($event) {
    $event.preventDefault();
    this.shared.next($event);
  }
}
