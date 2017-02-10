import {Component, Input, Output, EventEmitter, OnInit} from 'angular2/core';
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
import {Profile} from './profile/profile';
import {
  IProfile,
  IProfileEditLD,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel
} from './models/profiles';
import {ProfilesService} from './services/profiles-service';
import {AppService, ACTIONS, IApp, DEFAULTS} from '../authentication/services/app-service';
import {checkIfHasPermission} from '../authentication/services/token-manager-service';
import {NotificationsCollection} from '../notifications/services/notifications';
import {NotificationModel} from '../notifications/notification/notification';
import {FeedFilterButtonGroup} from '../feed/filter/general/filter';
import {ROUTES, FEED_TYPES} from '../../constants';
import {FeedModel, IFeedFilter} from '../feed/models';
import {ProfileIdService} from '../projects/services/projects-service';

@Component({
  selector: 'my-profiles',
  directives: [...ROUTER_DIRECTIVES, NgClass, Profile, FeedFilterButtonGroup],
  providers: [ProfilesService],
  styles: [require('./profiles.css')],
  template: require('./profiles.html')
})
@CanActivate(checkIfHasPermission)
export class MyProfiles implements OnInit {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() profiles: (ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel)[] = [];
  @Input() select: string;
  /* tslint:disable */
  myProfiles$: Subscription<(ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel)[]>;
  /* tslint:enable */
  state: IApp = DEFAULTS;
  state$: Subscription<IApp>;
  selectedProfileId: number = 0;

  constructor(
    private router: Router,
    private location: Location,
    private routeParams: RouteParams,
    private profileService: ProfilesService,
    public appSrv: AppService,
    public ProfileIdService: ProfileIdService
  ) {
    this.appSrv.$stream
    .subscribe((state) => {
      this.state = state;
      if (state.selectedProfile) {
        console.log('state.selectedProfile ', state.selectedProfile);
        this.selectedProfileId = state.selectedProfile['@id'];
      }
    });
  }

  onFilterChange($event: IFeedFilter = {}) {
    this.ProfileIdService.setSearchFeed($event);
    let type = $event.type.indexOf('job') > -1 ? 'JOBS' : $event.type.indexOf('space') > -1 ? 'SPACES' : $event.type.indexOf('profile') > -1 ? 'PROFILES' : '';
    this.ProfileIdService.setSelectedFeed(type);
    this.router.navigate(['/Feeds']);
    //this.applyFilter($event.term, $event);
  }

  isRoute(linkParams: any[]): boolean {
    return this.router.parent.isRouteActive(this.router.generate(linkParams));
  }

  isMyProfile() {
    return this.isRoute(['/MyProfiles']);
  }

  ngOnInit() {
    this.myProfiles$ = this.appSrv.$stream
      // .filter((state) => state.action === ACTIONS.MY_PROFILE_SET)
      .map((state) => state.myProfiles)
      .subscribe((myProfiles) => this.profiles = myProfiles);
  }

  getProfiles() {
    let methodName = this.isMyProfile() ? 'myProfiles' : 'query';
    let id = this.routeParams.get('id');
    this.profileService[methodName]().subscribe(
      (response) => {
        // TODO: Build JsonLD model to instantiate from response
        this.profiles = response['hydra:member'];
      }
    );
  }
}
