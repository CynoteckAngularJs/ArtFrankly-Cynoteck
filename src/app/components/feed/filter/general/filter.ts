import { Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation } from 'angular2/core';
import { ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate } from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass
} from 'angular2/common';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { AppService, ACTIONS } from '../../../authentication/services/app-service';
import { FeedsService } from '../../services/feeds-service';
import { FILTER_TYPES } from '../../../../constants';
import { JobsFilter } from './jobs/filter';
import { SpaceFilter } from './spaces/filter';
import { ProfilesFilter } from './profiles/filter';
import { IFeedFilter } from '../../models';
import { NotificationsCollection } from '../../../notifications/services/notifications';
import { NotificationModel } from '../../../notifications/notification/notification';
import {ProfileIdService} from '../../../projects/services/projects-service';

@Component({
  selector: 'feed-filter-button-group',
  directives: [...ROUTER_DIRECTIVES, NgClass, JobsFilter, ProfilesFilter, SpaceFilter],
  providers: [FeedsService],
  styles: [require('./filter.css')],
  template: require('./filter.html'),
  encapsulation: ViewEncapsulation.None
})
export class FeedFilterButtonGroup implements OnInit {
  @Output() filterchange: EventEmitter<any> = new EventEmitter();
  FILTER_TYPES: any = FILTER_TYPES;
  @Input() selectedType: string;
  
  isShowFilter: boolean = false;
  isSelected: string;
  jobFilter: IFeedFilter = {};
  profileFilter: IFeedFilter = {};
  spacesFilter: IFeedFilter = {};
  myFilter: IFeedFilter = {};
  constructor(
    private router: Router,
    private location: Location,
    private notificationsSvc: NotificationsCollection,
    private routeParams: RouteParams,
    private builder: FormBuilder,
    private feedsService: FeedsService,
    public appSrv: AppService,
    public ProfileIdService: ProfileIdService
  ) { }

  ngOnInit() {
this.isSelected = this.ProfileIdService.selectedFeed;
this.ProfileIdService.setSelectedFeed('');
   }

   onFilterChange($event, type: string) {
    $event.preventDefault();
    if (this.selectedType === type) {
      this.selectedType = undefined;
    } else {
      if (type === FILTER_TYPES.JOBS) {
        this.jobFilter = this.appSrv.getJobFilter();
        this.myFilter = this.appSrv.getJobFilter();
      } else if (type === FILTER_TYPES.PROFILES) {
        this.profileFilter = this.appSrv.getProfileFilter();
        this.myFilter = this.appSrv.getProfileFilter();
      } else if (type === FILTER_TYPES.SPACES) {
        this.spacesFilter = this.appSrv.getSpaceFilter();
        this.myFilter = this.appSrv.getSpaceFilter();
      }
      this.selectedType = type;
      this.isSelected = type;
    }
    this.filterchange.next(this.serialize(this.myFilter, type));
  }

  private serialize(filter: IFeedFilter, type: string): IFeedFilter {
    let serializedFilter = Object.assign({}, filter);
    serializedFilter.description = serializedFilter.jobServices;
    delete serializedFilter.jobServices;
    serializedFilter.subType = serializedFilter.jobPositionTypes;
    delete serializedFilter.jobPositionTypes;
    serializedFilter.location = serializedFilter.cities;
    serializedFilter.type = type == "JOBS" ? "job_posting" : type == "SPACES" ? "space_posting" : type == "PROFILES" ? "profile" : "";
    delete serializedFilter.cities;
    return serializedFilter;
  }

  comingSoon($event) {
    $event.preventDefault();

    this.notificationsSvc.push(new NotificationModel({
      message: `Coming soon!`,
      type: 'info',
      path: this.location.path()
    }));
  }

  onChange($event) {
    // this.appSrv.setJobFilter($event);
    if (this.selectedType === FILTER_TYPES.JOBS) {
      this.appSrv.setJobFilter($event);
    } else if (this.selectedType === FILTER_TYPES.PROFILES) {
      this.appSrv.setProfileFilter($event);
    } else if (this.selectedType === FILTER_TYPES.SPACES) {
      this.appSrv.setSpaceFilter($event);
    }
    this.filterchange.next($event);
      this.isSelected = this.selectedType;
    this.selectedType = undefined;
  }

  close($event) {
    $event.preventDefault();
    this.selectedType = undefined;
  }
}
