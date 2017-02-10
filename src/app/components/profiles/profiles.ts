import {Component, Input, Output, EventEmitter, OnInit} from 'angular2/core';
import {RouteConfig, ROUTER_DIRECTIVES, Router, RouteParams, Location} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass
} from 'angular2/common';
import {Profile} from './profile/profile';
import {IProfile} from './models/profiles';
import {ProfilesService} from './services/profiles-service';
import {FeedFilterButtonGroup} from '../feed/filter/general/filter';
import {AppService, ACTIONS, IApp, DEFAULTS} from '../authentication/services/app-service';
import {ROUTES, FEED_TYPES} from '../../constants';
import {Auth} from '../authentication/services/auth-service';
import {Subscription} from 'rxjs/Subscription';
import {FeedModel, IFeedFilter} from '../feed/models';
import {ProfileIdService} from '../projects/services/projects-service';

@Component({
  selector: 'profiles',
  directives: [...ROUTER_DIRECTIVES, NgClass, Profile, FeedFilterButtonGroup],
  providers: [ProfilesService],
  styles: [require('./profiles.css')],
  template: require('./profiles.html')
})
export class Profiles implements OnInit {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() profiles: IProfile[] = [];
  @Input() select: string;
  @Output() filterchange: EventEmitter<any> = new EventEmitter();
  state: IApp = DEFAULTS;
  state$: Subscription<IApp>;
  selectedProfileId: number = 0;
  lastAppliedFilter: IFeedFilter;

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

  isRoute(linkParams: any[]): boolean {
    return this.router.parent.isRouteActive(this.router.generate(linkParams));
  }

  isMyProfile() {
    return this.isRoute(['/MyProfiles']);
  }

  goToProfile($event) {
    $event.preventDefault();
    if (this.state && this.state.selectedProfile) {
      this.router.navigate(this.state.selectedProfile.getRouterLink());
    }
  }

  onFilterChange($event: IFeedFilter = {}) {
   
    this.ProfileIdService.setSearchFeed($event);
    let type = $event.type.indexOf('job') > -1 ? 'JOBS' : $event.type.indexOf('space') > -1 ? 'SPACES' : $event.type.indexOf('profile') > -1 ? 'PROFILES' : '';
    this.ProfileIdService.setSelectedFeed(type);
    this.router.navigate(['/Feeds']);
    //this.applyFilter($event.term, $event);
  }

  ngOnInit() {
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
