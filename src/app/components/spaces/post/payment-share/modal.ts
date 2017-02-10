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
// import {Signin} from './signin';
import {Modal, IModal} from '../../../modal/modal';
import {NotificationsCollection} from '../../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../../notifications/notification/notification';
import {ISpacePost, SpacePostStorage, SpacePostModel} from '../models';
import {SpacePostPayment} from './spacepost-payment/spacepost-payment';
import {SpacePostShare} from './spacepost-share/spacepost-share';
import {SpacePostsService} from '../../services/spaceposts-service';
import {PAYMENT_SHARE_PARAM, ROUTES} from '../../../../constants';

@Component({
  selector: 'spacepost-payment-share-modal',
  directives: [...ROUTER_DIRECTIVES,
  NgClass,
  Modal,
  Notification,
  SpacePostPayment,
  SpacePostShare],
  providers: [SpacePostsService],
  pipes: [AsyncPipe],
  styles: [ require('./modal.css') ],
  template: require('./modal.html'),
  encapsulation: ViewEncapsulation.None
})
export class SpacePostPaymentShareModal implements OnInit {
  @Input() modal: IModal = {
    title: 'Payment',
    hideOnClose: true,
  };
  isPaymentProcessed: boolean = false;
  @Input() spacepost: ISpacePost;
  @Output() close: EventEmitter<any> = new EventEmitter();
  notifications: Observable<NotificationModel[]>;
  @ViewChild(Modal) modalDialog;

  constructor(
    private router: Router,
    private routeParams: RouteParams,
    public notificationsSrv: NotificationsCollection,
    private spacepostsService: SpacePostsService
  ) {
    this.isPaymentProcessed = !!this.routeParams.get(PAYMENT_SHARE_PARAM);
  }

  ngOnInit() {
    this.notifications = this.notificationsSrv.$stream;
    let DEFAULTS = { contactLocation: { address: {} }, spaceLocation: { address: {} } };
    this.spacepost = Object.assign({}, DEFAULTS, this.spacepost);
    let isSpacePostProvided = this.spacepost && this.spacepost['@id'];
    if (!isSpacePostProvided) {
      this.getSpacePost();
    }
  }

  getSpacePost() {
    let id = this.routeParams.get('id');
    this.spacepostsService.get(id).subscribe(
      (response: SpacePostModel) => {
        this.spacepost = response;
      },
      (error) => {
        /* tslint:disable */
        this.notificationsSrv.push(new NotificationModel({
            message: `Error has occured while retrieving space post details! Please try refreshing the page.`,
            type: 'danger'
          }));
        /* tslint:enable */
      }
    );
  }

  closeModal($event) {
    this.modalDialog.onClose($event);
  }

  onClose($event) {
    if (this.isPaymentProcessed) {
      this.router.parent.navigate(ROUTES.POST_PAYPAL_SUCCESS);
    }
    this.close.next($event);
  }

  onHide($event) {
    if (this.isPaymentProcessed) {
      this.router.parent.navigate(ROUTES.POST_PAYPAL_SUCCESS);
    }
    this.modal.opened = false;
  }

  onPaymentSuccess($event) {
    // TODO: Uncomment this out when PAYPAL FLOW is added
    this.isPaymentProcessed = true;
  }
}
