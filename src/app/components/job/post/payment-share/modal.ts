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
import {IJobPost, JobPostStorage, JobPostModel} from '../models';
import {JobPostPayment} from './jobpost-payment/jobpost-payment';
import {JobPostShare} from './jobpost-share/jobpost-share';
import {JobPostsService} from '../../services/jobposts-service';
import {PAYMENT_SHARE_PARAM, ROUTES} from '../../../../constants';

@Component({
  selector: 'jobpost-payment-share-modal',
  directives: [...ROUTER_DIRECTIVES, NgClass, Modal, Notification, JobPostPayment, JobPostShare],
  providers: [JobPostsService],
  pipes: [AsyncPipe],
  styles: [ require('./modal.css') ],
  template: require('./modal.html'),
  encapsulation: ViewEncapsulation.None
})
export class JobPostPaymentShareModal implements OnInit {
  @Input() modal: IModal = {
    title: 'Payment',
    hideOnClose: true,
  };
  isPaymentProcessed: boolean = false;
  @Input() jobpost: IJobPost;
  @Output() close: EventEmitter<any> = new EventEmitter();
  notifications: Observable<NotificationModel[]>;
  @ViewChild(Modal) modalDialog;

  constructor(
    private router: Router,
    private routeParams: RouteParams,
    public notificationsSrv: NotificationsCollection,
    private jobpostsService: JobPostsService
  ) {
    this.isPaymentProcessed = !!this.routeParams.get(PAYMENT_SHARE_PARAM);
  }

  ngOnInit() {
    this.notifications = this.notificationsSrv.$stream;
    let DEFAULTS = { contactLocation: { address: {} }, jobLocation: { address: {} } };
    this.jobpost = Object.assign({}, DEFAULTS, this.jobpost);
    let isJobPostProvided = this.jobpost && this.jobpost['@id'];
    if (!isJobPostProvided) {
      this.getJobPost();
    }
  }

  getJobPost() {
    let id = this.routeParams.get('id');
    this.jobpostsService.get(id).subscribe(
      (response: JobPostModel) => {
        this.jobpost = response;
      },
      (error) => {
        /* tslint:disable */
        this.notificationsSrv.push(new NotificationModel({
            message: `Error has occured while retrieving job post details! Please try refreshing the page.`,
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
