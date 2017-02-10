import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  AfterViewInit
} from 'angular2/core';
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
import { FeedModel, IFeedFilter } from '../models';
import { FeedsService } from '../services/feeds-service';
import { AppService, ACTIONS } from '../../authentication/services/app-service';
import { FeedFilter } from '../filter/filter';
import { checkIfHasPermission } from '../../authentication/services/token-manager-service';
import { JobPostModel, IJobPost } from '../../job/post/models';
import { JobPostReply } from '../../job/post/reply/reply';
import { JobPostReplySuccess } from '../../job/post/reply/success/success';
import { Auth } from '../../authentication/services/auth-service';
import { FeedJobPostDetails } from '../details/jobpost/index';
import { FeedProfileDetails } from '../details/profile/profile';
import { SearchService } from '../../search/services/search-service';
import { FeedFilterButtonGroup } from '../filter/general/filter';

import { SpacePostModel, ISpacePost } from '../../spaces/post/models';
import { SpacePostReply } from '../../spaces/post/reply/reply';
import { SpacePostReplySuccess } from '../../spaces/post/reply/success/success';
import { FeedSpacePostDetails } from '../details/spacepost/index';
import { ProfileIdService } from '../../projects/services/projects-service';

@Component({
  selector: 'feeds',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    FeedFilter,
    JobPostReply,
    JobPostReplySuccess,
    FeedJobPostDetails,
    FeedProfileDetails,
    FeedFilterButtonGroup,
    SpacePostReply,
    SpacePostReplySuccess,
    FeedSpacePostDetails,
  ],
  providers: [FeedsService, Auth, SearchService],
  styles: [require('./feeds.css')],
  template: require('./feeds.html')
})
@CanActivate(checkIfHasPermission)
export class Feeds implements OnInit, AfterViewInit {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() feeds: FeedModel[] = [];
  @Input() select: string;
  @Input() search: string;
  @ViewChild(FeedFilter) filter: FeedFilter;
  selectedJobPost: JobPostModel;
  selectedSpacePost: SpacePostModel;
  lastAppliedFilter: IFeedFilter;
  replyModal: any = {
    title: 'Send a reply to job post',
    hideOnClose: true,
  };
  replySuccessModal: any = {
    title: 'Job reply sent',
    hideOnClose: true,
  };
  searchTerm: string;
  total: number;
  selectedType: string;
  nextPage: string;
 hasData: boolean = true;
  islength: boolean = false;
  isRedirected: boolean = true;
  constructor(
    private router: Router,
    private location: Location,
    private routeParams: RouteParams,
    private feedsService: FeedsService,
    private searchService: SearchService,
    public appSrv: AppService,
    public auth: Auth,
    public ProfileIdService: ProfileIdService
  ) {
    this.selectedType = this.routeParams.get('type');
  }

  ngOnInit() {
    // this.getFeeds();
  }

  ngAfterViewInit() {
    this.isRedirected = true;
    if (this.ProfileIdService.feed != null && this.routeParams.get('term') == null) {
      this.onFilterChange(this.ProfileIdService.feed);
    }
    else {
      this.filter.serializedForm.subscribe(
        // (values) => this.getFeeds(values, this.getSearchTerm())
        (values) => {
          // We're only interested into sort!
          let sortFilter = { 'order[dateModified]': values['order[dateModified]'] };
          this.appSrv.setSort(sortFilter);
          this.lastAppliedFilter = Object.assign({}, this.lastAppliedFilter || {}, sortFilter);
          this.applyFilter();
        }
      );
      this.getFeeds(this.getFilterValue(), this.getSearchTerm());
    }
  }

  getFilterValue() {
    let filter = this.filter.serializeForm(this.filter.form.value);
    filter.type = filter.type || this.selectedType || '';
    return filter;
  }

  getSearchTerm() {
    return this.searchTerm = this.routeParams.get('term');
  }

  getFeeds(filter?: IFeedFilter, searchTerm?: string) {
    let resultsObservable;
   if (searchTerm) {
      resultsObservable = this.searchService.query(searchTerm, filter);
   } else {
     resultsObservable = this.searchService.query('profile', filter);
       // resultsObservable = this.feedsService.query(filter);
   }
    resultsObservable.subscribe(
      (response) => {
        this.feeds = response['hydra:member'];
        this.total = response['hydra:totalItems'];
        this.nextPage = response['hydra:nextPage'];
        this.hasData = this.total > 0 ? true : false;
        this.islength = this.feeds.length > 0 ? true : false;
      }
    );
  }

  applyFilter(searchTerm?: string, filter?: IFeedFilter) {
    let resultsObservable;
    searchTerm = searchTerm ||
      (this.lastAppliedFilter && this.lastAppliedFilter.term) ||
      this.getSearchTerm() ||
      '';
    filter = filter || this.lastAppliedFilter || {};
    // if (searchTerm) {
    resultsObservable = this.searchService.query(searchTerm, filter);
    // } else {
    //   resultsObservable = this.feedsService.query(filter);
    // }
    resultsObservable.subscribe(
      (response) => {
        this.lastAppliedFilter = Object.assign({}, filter || {}, { term: searchTerm });
        this.feeds = response['hydra:member'];
        this.total = response['hydra:totalItems'];
        this.nextPage = response['hydra:nextPage'];
        this.hasData = this.total > 0 ? true : false;
        this.islength = this.feeds.length > 0 ? true : false;
      }
    );
    searchTerm = '';
  }

   onFilterChange($event: IFeedFilter = {}) {
    if (this.routeParams.get('term') != null) {
     this.ProfileIdService.setSearchFeed($event);
    let type = $event.type.indexOf('job') > -1 ? 'JOBS' : $event.type.indexOf('space') > -1 ? 'SPACES' : $event.type.indexOf('profile') > -1 ? 'PROFILES' : '';
    this.ProfileIdService.setSelectedFeed(type);
    this.router.navigate(['/Feeds']);
    }
    this.hasData = true;this.islength = false;
    if (!this.isRedirected) {
      this.feeds = null;
    } else {
      this.isRedirected = false;
    }
    this.applyFilter($event.term, $event);
  }

  goToFeed(feed: FeedModel, $event) {
    $event.preventDefault();
    this.router.navigate(feed.routerLink);
  }

  onReplyHandler(feed: FeedModel) {
    let jobpost = feed.toJobPost();
    if (jobpost) {
      this.selectedJobPost = jobpost;
      this.replyModal.opened = true;
      // this.replySuccessModal.opened = true;
    }

    let spacepost = feed.toSpacePost();
    if (spacepost) {
      this.selectedSpacePost = spacepost;
      this.replyModal.opened = true;
      // this.replySuccessModal.opened = true;
    }
  }

  onReply($event, feed: FeedModel) {
    $event.preventDefault();
    let jobpost = feed.toJobPost();
    if (jobpost) {
      this.selectedJobPost = jobpost;
      this.replyModal.opened = true;
      // this.replySuccessModal.opened = true;
    }

    let spacepost = feed.toSpacePost();
    if (jobpost) {
      this.selectedSpacePost = spacepost;
      this.replyModal.opened = true;
      // this.replySuccessModal.opened = true;
    }
  }

  onReplyModalHide($event) {
    this.replyModal.opened = false;
  }

  onReplySuccess($event) {
    console.log('onReplySuccess($event) ', $event);
    this.replyModal.opened = false;
    this.replySuccessModal.opened = true;
  }

  onReplySuccessModalHide($event) {
    this.replySuccessModal.opened = false;
  }

  onLoadMore($event) {
    console.log('onLoadMore($event) ', $event);
    console.log('this.nextPage: ', this.nextPage);

    let resultsObservable;
    resultsObservable = this.searchService.nextPage(this.nextPage);

    resultsObservable.subscribe(
      (response) => {
        this.feeds = this.feeds.concat(response['hydra:member']);
        this.total = response['hydra:totalItems'];
        this.nextPage = response['hydra:nextPage'];
      }
    );
  }
}
