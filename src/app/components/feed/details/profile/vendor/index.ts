import {Component, Input, Output, EventEmitter, OnInit, OnChanges} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass
} from 'angular2/common';
import {Subscription} from 'rxjs/Subscription';
import {FeedModel, IFeedFilter} from '../../../models';
import {FeedsService} from '../../../services/feeds-service';
import {AppService, ACTIONS} from '../../../../authentication/services/app-service';
import {FeedFilter} from '../../../filter/filter';
import {checkIfHasPermission} from '../../../../authentication/services/token-manager-service';
import {JobPostModel, IJobPost} from '../../../../job/post/models';
import {JobPostReply} from '../../../../job/post/reply/reply';
import {JobPostReplySuccess} from '../../../../job/post/reply/success/success';
import {Auth} from '../../../../authentication/services/auth-service';
import {NotificationsCollection} from '../../../../notifications/services/notifications';
import {NotificationModel} from '../../../../notifications/notification/notification';
import {
  FormatDatePipe,
  FormatAddressPipe,
  CommaPipe,
  SmarTextPipe,
  ReversePipe,
  SortByDatePipe,
  CommaLimitedPipe
} from '../../../../../url/pipes/pipes';
import {FallbackImgDirective} from '../../../../../url/components/fallbackimg';

@Component({
  selector: 'feed-vendor-details',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    FeedFilter,
    JobPostReply,
    JobPostReplySuccess,
    FallbackImgDirective
  ],
  pipes: [
    FormatDatePipe,
    FormatAddressPipe,
    CommaPipe,
    SmarTextPipe,
    ReversePipe,
    SortByDatePipe,
    CommaLimitedPipe
  ],
  providers: [FeedsService, Auth],
  styles: [ require('../../../list/feeds.css') ],
  template: require('./index.html')
})
@CanActivate(checkIfHasPermission)
export class FeedVendorDetails implements OnInit, OnChanges {
  @Input() feed: FeedModel = new FeedModel();
  // @Output() onreply: EventEmitter<any> = new EventEmitter();
  routerLink: any;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      private feedsService: FeedsService,
      public appSrv: AppService,
      public auth: Auth,
      private notificationsSvc: NotificationsCollection
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: any) {
    if (changes.feed && changes.feed.currentValue) {
       let routerLinkArray = [];
      routerLinkArray[0] = this.feed.routerLink[0];
      routerLinkArray[1] = { id: this.feed.name.trim().replace(/[^A-Za-z0-9]+/g,'-')+'?uId='+ this.feed.routerLink[1].id, type: this.feed.routerLink[1].type };
      routerLinkArray[2] = this.feed.routerLink[1].id;
      this.routerLink = routerLinkArray;
    }
  }

  comingSoon($event) {
      $event.preventDefault();

      this.notificationsSvc.push(new NotificationModel({
          message: `Coming soon!`,
          type: 'info'
      }));
  }
}
