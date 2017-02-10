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
import {IJobPost, JobPostStorage, JobPostModel} from '../../models';
import {JobPostsService} from '../../../services/jobposts-service';
import {CouponService} from '../../../services/coupon-service';
import {JOB_POST_STATES} from '../../../../../constants';
import {Utils} from '../../../../../url/utils/index';
import {DATE_FORMAT, DATE_TIME_FORMAT} from '../../../../../config';
import {FormatAddressPipe} from '../../../../../url/pipes/pipes';
import {STRIPE_PK} from '../../../../../config';

const fullAmount = 6000;
declare var moment: any;
declare var fbq: any;

@Component({
  selector: 'jobpost-payment',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Notification],
  providers: [JobPostsService, CouponService],
  pipes: [AsyncPipe, FormatAddressPipe],
  // styles: [ require('./jobpost-payment.css') ],
  template: require('./jobpost-payment.html'),
  encapsulation: ViewEncapsulation.None
})
export class JobPostPayment implements OnInit {
  @Input() jobpost: IJobPost;
  @Output() paymentsuccess: EventEmitter<any> = new EventEmitter();
  @Output() cancel: EventEmitter<any> = new EventEmitter();

  notifications: Observable<NotificationModel[]>;
  JOB_POST_STATES: any = JOB_POST_STATES;
  datePostedHuman: string;
  stripeHandler: any;

  constructor(
    private router: Router,
    public notificationsSrv: NotificationsCollection,
    private jobpostsService: JobPostsService,
    private couponService: CouponService
  ) {}

  ngOnInit() {
    fbq('track', 'InitiateCheckout');

    this.notifications = this.notificationsSrv.$stream;
    let DEFAULTS = { contactLocation: { address: {} }, jobLocation: { address: {} } };
    this.jobpost = new JobPostModel(Object.assign({}, DEFAULTS, this.jobpost));

    this.datePostedHuman = Utils.format(this.jobpost.datePosted, DATE_FORMAT);

    this.initStripeHandler();
  }

  initStripeHandler() {
    // we need to capture jobPost and other vars inside Stripe 'token' callback
    var jobpostVar = this.jobpost;
    var jobpostsServiceVar = this.jobpostsService;
    var notificationsSrvVar = this.notificationsSrv;
    var paymentsuccessVar = this.paymentsuccess;

    this.stripeHandler = (<any>window).StripeCheckout.configure({
        key: STRIPE_PK,
        image: 'https://artfrankly.com/assets/img/logos/stripe_af.png',
        locale: 'auto',
        token: function(token) {
            jobpostsServiceVar.checkoutStripe(
                jobpostVar.id,
                token.id,
                jobpostsServiceVar.getAmount()
            ).subscribe(
                (response: { approvalUrl: string }) => {
                    paymentsuccessVar.next({ jobpost: jobpostVar, response: response });
                },
                (error) => {
                    notificationsSrvVar.push(new NotificationModel({
                        message: `Error has occured while connecting to Stripe!`,
                        type: 'danger'
                    }));
                }
            );
        }
    });
  }

  triggerPayment($event, couponCode: string) {
    $event.preventDefault();
    fbq('track', 'AddPaymentInfo');

    let jobPostId = this.jobpost.id;
    // TODO: Uncomment below for PAYPAL FLOW
    // if (this.jobpost.state === JOB_POST_STATES.PENDING) {
    //   this.getAndRedirectToApprovalUrl(jobPostId);
    // } else {
    //   this.payViaPaypal(jobPostId);
    // }
    // TODO: Comment out below which AVOIDS PAYPAL FLOW

    //this.directPublish(jobPostId);
    this.payViaStripe(jobPostId, couponCode);
  }

  getAndRedirectToApprovalUrl(jobPostId: string) {
    this.jobpostsService.getLastPayment(jobPostId).subscribe(
      (response: { approvalUrl: string }) => {
        this.paymentsuccess.next({ jobpost: this.jobpost, response: response });
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

  payViaPaypal(jobPostId: string) {
    this.jobpostsService.checkoutPayPal(jobPostId).subscribe(
      (response: { approvalUrl: string }) => {
        this.paymentsuccess.next({ jobpost: this.jobpost, response: response });
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

  payViaStripe(jobPostId: string, couponCode: string) {
      this.jobpostsService.setAmount(fullAmount);

      if (this.couponService.isValidCouponCode(couponCode)) {
          let couponAmount = this.couponService.getAmount(fullAmount, couponCode);

          if (!couponAmount) {
            this.directPublish(jobPostId);
            return;
          }

          this.jobpostsService.setAmount(couponAmount);
      }

      this.stripeHandler.open({
          name: 'ArtFrankly',
          description: 'Job Post - 1 month',
          amount: this.jobpostsService.getAmount()
      });
  }

  directPublish(jobPostId: string) {
    this.jobpostsService.publish(jobPostId).subscribe(
      (response) => {
        this.paymentsuccess.next({ jobpost: this.jobpost, response: response });
        // TODO: Open share modal dialog
      },
      (error) => {
        this.notificationsSrv.push(new NotificationModel({
            message: `Error has occured while publishing a Job Post! Please try again.`,
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
