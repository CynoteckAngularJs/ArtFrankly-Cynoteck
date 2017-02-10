import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from 'angular2/core';
import { ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate } from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass
} from 'angular2/common';
import { Subscription } from 'rxjs/Subscription';
import { FeedModel, IFeedFilter } from '../../models';
import { FeedsService } from '../../services/feeds-service';
import { AppService, ACTIONS } from '../../../authentication/services/app-service';
import { FeedFilter } from '../../filter/filter';
import { checkIfHasPermission } from '../../../authentication/services/token-manager-service';
import { SpacePostModel, ISpacePost } from '../../../spaces/post/models';
import { SpacePostReply } from '../../../spaces/post/reply/reply';
import { SpacePostReplySuccess } from '../../../spaces/post/reply/success/success';
import { Auth } from '../../../authentication/services/auth-service';
import { FormatDatePipe } from '../../../../url/pipes/pipes';
import { FallbackImgDirective } from '../../../../url/components/fallbackimg';

@Component({
  selector: 'feed-spacepost-details',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    FeedFilter,
    SpacePostReply,
    SpacePostReplySuccess,
    FallbackImgDirective
  ],
  providers: [FeedsService, Auth],
  pipes: [FormatDatePipe],
  styles: [require('../../list/feeds.css')],
  template: require('./index.html')
})
@CanActivate(checkIfHasPermission)
export class FeedSpacePostDetails implements OnInit, OnChanges {
  @Input() feed: FeedModel = new FeedModel();
  @Output() onreply: EventEmitter<any> = new EventEmitter();
  routerLink: any;

  constructor(
    private router: Router,
    private location: Location,
    private routeParams: RouteParams,
    private feedsService: FeedsService,
    public appSrv: AppService,
    public auth: Auth
  ) { }

  ngOnInit() { }

  ngOnChanges(changes: any) {
    if (changes.feed && changes.feed.currentValue) {
      //this.routerLink = this.feed.routerLink;
      let routerLinkArray = [];
      let newJobName = this.feed.name.trim();
      routerLinkArray[0] = this.feed.routerLink[0];
      routerLinkArray[1] = { id: newJobName.replace(/[^A-Za-z0-9]+/g, '-') + '?uId=' + this.feed.routerLink[1].id };
      routerLinkArray[2] = this.feed.routerLink[1].id;
      this.routerLink = routerLinkArray;
    }
  }

  onReply($event, feed: FeedModel) {
    $event.preventDefault();
    this.onreply.next(feed);
  }

}
