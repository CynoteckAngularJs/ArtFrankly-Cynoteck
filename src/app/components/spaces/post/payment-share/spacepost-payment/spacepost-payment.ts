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
import {SpacePostsService} from '../../../services/spaceposts-service';
import {SPACE_POST_STATES} from '../../../../../constants';
import {Utils} from '../../../../../url/utils/index';
import {DATE_FORMAT, DATE_TIME_FORMAT} from '../../../../../config';
import {FormatAddressPipe} from '../../../../../url/pipes/pipes';

declare var moment: any;
declare var fbq: any;

@Component({
  selector: 'spacepost-payment',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Notification],
  providers: [SpacePostsService],
  pipes: [AsyncPipe, FormatAddressPipe],
  // styles: [ require('./spacepost-payment.css') ],
  template: require('./spacepost-payment.html'),
  encapsulation: ViewEncapsulation.None
})
export class SpacePostPayment implements OnInit {
  @Input() spacepost: ISpacePost;
  @Output() paymentsuccess: EventEmitter<any> = new EventEmitter();
  @Output() cancel: EventEmitter<any> = new EventEmitter();
  notifications: Observable<NotificationModel[]>;
  SPACE_POST_STATES: any = SPACE_POST_STATES;
  datePostedHuman: string;

  constructor(
    private router: Router,
    public notificationsSrv: NotificationsCollection,
    private spacepostsService: SpacePostsService
  ) {}

  ngOnInit() {
    fbq('track', 'InitiateCheckout');

    this.notifications = this.notificationsSrv.$stream;
    let DEFAULTS = { contactLocation: { address: {} }, spaceLocation: { address: {} } };
    this.spacepost = new SpacePostModel(Object.assign({}, DEFAULTS, this.spacepost));

    this.datePostedHuman = Utils.format(this.spacepost.datePosted, DATE_FORMAT);
  }

  triggerPayment($event) {
    $event.preventDefault();
    fbq('track', 'AddPaymentInfo');

    let spacePostId = this.spacepost.id;
    // TODO: Uncomment below for PAYPAL FLOW
    // if (this.spacepost.state === SPACE_POST_STATES.PENDING) {
    //   this.getAndRedirectToApprovalUrl(spacePostId);
    // } else {
    //   this.payViaPaypal(spacePostId);
    // }
    // TODO: Comment out below which AVOIDS PAYPAL FLOW
    this.directPublish(spacePostId);
  }

  getAndRedirectToApprovalUrl(spacePostId: string) {
    this.spacepostsService.getLastPayment(spacePostId).subscribe(
      (response: { approvalUrl: string }) => {
        this.paymentsuccess.next({ spacepost: this.spacepost, response: response });
        // Redirect user to approvalUrl (Paypal Form)
        window.location.href = response.approvalUrl;
      },
      (error) => {
        this.notificationsSrv.push(new NotificationModel({
            message: `Error has occured while connecting to Paypal! Please try paying again.`,
            type: 'danger'
          }));
      }
    );
  }

  payViaPaypal(spacePostId: string) {
    this.spacepostsService.checkout(spacePostId).subscribe(
      (response: { approvalUrl: string }) => {
        this.paymentsuccess.next({ spacepost: this.spacepost, response: response });
        // Redirect user to approvalUrl (Paypal Form)
        window.location.href = response.approvalUrl;
      },
      (error) => {
        this.notificationsSrv.push(new NotificationModel({
            message: `Error has occured while connecting to Paypal! Please try paying again.`,
            type: 'danger'
          }));
      }
    );
  }

  directPublish(spacePostId: string) {
    this.spacepostsService.publish(spacePostId).subscribe(
      (response) => {
        this.paymentsuccess.next({ spacepost: this.spacepost, response: response });
        // TODO: Open share modal dialog
      },
      (error) => {
        this.notificationsSrv.push(new NotificationModel({
            message: `Error has occured while publishing a Space Post! Please try again.`,
            type: 'danger'
          }));
      }
    );
  }

  onCancel($event) {
    $event.preventDefault();
    this.cancel.next($event);
  }

  hasAddress(address: any) {
    return !Utils.isAddressEmpty(address);
  }
}
