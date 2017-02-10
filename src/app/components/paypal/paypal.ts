import {Component, ViewEncapsulation, OnInit} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {ROUTES, PAYMENT_SHARE_PARAM} from '../../constants';
import {PaypalService} from './paypal-services';
import {IPaypal, PaypalModel, PaymentModel} from './models';
import {NotificationsCollection} from '../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../notifications/notification/notification';
import {IJobPost, JobPostModel} from '../job/post/models';
import {Utils} from '../../url/utils/index';

const PARAM_NAMES = {
  paymentId: 'paymentId',
  token: 'token',
  payerId: 'PayerID'
};

@Component({
  selector: 'paypal-handler',
  directives: [...ROUTER_DIRECTIVES],
  providers: [PaypalService],
  pipes: [AsyncPipe],
  // styles: [ require('./paypal.css') ],
  template: require('./paypal.html'),
  encapsulation: ViewEncapsulation.None
})
export class PaypalHandler implements OnInit {
  paypalData: IPaypal = {};

  constructor(
    private router: Router,
    private routeParams: RouteParams,
    public notificationsSrv: NotificationsCollection,
    private paypalService: PaypalService
  ) {
    this.paypalData[PARAM_NAMES.paymentId] = this.routeParams.get(PARAM_NAMES.paymentId);
    this.paypalData[PARAM_NAMES.payerId] = this.routeParams.get(PARAM_NAMES.payerId);
    this.paypalData[PARAM_NAMES.token] = this.routeParams.get(PARAM_NAMES.token);
  }

  ngOnInit() {
    this.getPaymentInfo(this.paypalData);
  }

  getPaymentInfo(paypalData: IPaypal) {
    this.paypalService.getPaymentInfo(paypalData).subscribe(
      (response: JobPostModel) => {
        console.log('getPaymentInfo()', response);
        // TODO: Redirect to payment success page
        let REDIRECT_URL = [...ROUTES.POST_JOB_PAYMENT_SUCCESS];
        REDIRECT_URL[1].id = response.id;
        // Cause share modal to show!
        REDIRECT_URL[1][PAYMENT_SHARE_PARAM] = true;
        this.router.parent.navigate(REDIRECT_URL);
      },
      (error) => {
        let msg = `Error while retrieving payment info! Please try refreshing the page.`;
        this.notificationsSrv.push(new NotificationModel({
            message: msg,
            type: 'danger'
          }));
      }
    );
  }
}


@Component({
  selector: 'paypal-canceled-handler',
  directives: [...ROUTER_DIRECTIVES],
  providers: [PaypalService],
  pipes: [AsyncPipe],
  // styles: [ require('./paypal.css') ],
  template: require('./paypal.html'),
  encapsulation: ViewEncapsulation.None
})
export class PaypalCanceledHandler implements OnInit {
  paypalData: IPaypal = {};

  constructor(
    private router: Router,
    private routeParams: RouteParams,
    public notificationsSrv: NotificationsCollection,
    private paypalService: PaypalService
  ) {}

  ngOnInit() {
    this.getInfoByToken(this.routeParams.get('token'));
  }

  getInfoByToken(token: string) {
    if (token) {
      this.paypalService.getInfoByToken(token).subscribe(
        (response: PaymentModel) => {
          /* tslint:disable */
          // let msg = `Payment has been canceled! Please make sure to pay the job in order to make it published!`
          /* tslint:enable */
          // this.notificationsSrv.push(new NotificationModel({
          //     message: msg,
          //     type: 'success'
          //   }));
          // TODO: Redirect to payment canceled page
          let REDIRECT_URL = [...ROUTES.POST_JOB_PAYMENT_CANCELED];
          REDIRECT_URL[1].id = Utils.extractIdFromIRI(response.jobPosting);
          this.router.parent.navigate(REDIRECT_URL);
        },
        (error: any) => {
          // 404 -> Expired token (returned by backend) 
          if (error.status === 404) {
            /* tslint:disable */
            let msg = `This payment has been canceled and no longer valid! Please start the payment process from the beginning!`;
            /* tslint:enable */
            this.notificationsSrv.push(new NotificationModel({
                message: msg,
                type: 'danger'
              }));
          } else {
            /* tslint:disable */
            this.notificationsSrv.push(new NotificationModel({
                message: `Error while retrieving job post for the payment! Please try refreshing the page.`,
                type: 'danger'
              }));
            /* tslint:enable */
          }
          this.router.parent.navigate(ROUTES.POST_SIGNOUT_ROUTE);
        }
      );
    } else {
      /* tslint:disable */
      this.notificationsSrv.push(new NotificationModel({
          message: `Paypal token missing! Paypal token is required for retrieving additional information.`,
          type: 'danger'
        }));
      /* tslint:enable */
    }
  }
}
