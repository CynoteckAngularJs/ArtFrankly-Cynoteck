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
import {FeedModel, IFeedFilter} from '../../models';
import {FeedsService} from '../../services/feeds-service';
import {AppService, ACTIONS} from '../../../authentication/services/app-service';
import {FeedFilter} from '../../filter/filter';
import {checkIfHasPermission} from '../../../authentication/services/token-manager-service';
import {JobPostModel, IJobPost} from '../../../job/post/models';
import {JobPostReply} from '../../../job/post/reply/reply';
import {JobPostReplySuccess} from '../../../job/post/reply/success/success';
import {Auth} from '../../../authentication/services/auth-service';
import {FeedInstitutionDetails} from './institution/index';
import {FeedProfessionalDetails} from './professional/index';
import {FeedVendorDetails} from './vendor/index';

@Component({
  selector: 'feed-profile-details',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    FeedFilter,
    JobPostReply,
    JobPostReplySuccess,
    FeedInstitutionDetails,
    FeedProfessionalDetails,
    FeedVendorDetails
  ],
  providers: [FeedsService, Auth],
  styles: [ require('../../list/feeds.css') ],
  template: require('./profile.html')
})
@CanActivate(checkIfHasPermission)
export class FeedProfileDetails implements OnInit, OnChanges {
  @Input() feed: FeedModel = new FeedModel();
  // @Output() onreply: EventEmitter<any> = new EventEmitter();
  routerLink: any;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      private feedsService: FeedsService,
      public appSrv: AppService,
      public auth: Auth
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: any) {
    if (changes.feed && changes.feed.currentValue) {
      this.routerLink = this.feed.routerLink;
    }
  }

}
