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
import {ProfileEditLDModel} from '../models/profiles';
import {ProfilesService} from '../services/profiles-service';
import {AppService, ACTIONS, IApp, DEFAULTS} from '../../authentication/services/app-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {FallbackImgDirective} from '../../../url/components/fallbackimg';
import {Subscription} from 'rxjs/Subscription';
import {IProfile} from '../models/profiles';
import {ROUTES, FEED_TYPES} from '../../../constants';
import {ProfileIdService} from '../../projects/services/projects-service';
import {FeedModel, IFeedFilter} from '../../feed/models';

@Component({
  selector: 'profile',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, FallbackImgDirective],
  providers: [ProfilesService],
  styles: [require('./profile.css')],
  template: require('./profile.html')
})
export class Profile implements OnInit {
  @Output() deleted: EventEmitter<any> = new EventEmitter();
  @Input() profile: ProfileEditLDModel;
  @Input() profiles: IProfile[] = [];
  state: IApp = DEFAULTS;
  state$: Subscription<IApp>;
  selectedProfileId: string = '';
  FEED_TYPES: any = FEED_TYPES;
  profileType:string='';
  userId:string='';
  constructor(
      private router: Router,
      private notificationsSvc: NotificationsCollection,
      private routeParams: RouteParams,
      private profileService: ProfilesService,
      private appSrv: AppService,
    public ProfileIdService: ProfileIdService
  ) {
     this.appSrv.$stream
      .subscribe((state) => {
        this.state = state;
        if (state.selectedProfile) {
          this.profileType = state.selectedProfile['@id'].split('/')[1];
          if(this.profileType=='vendors' || this.profileType == 'institutions')
            this.selectedProfileId = state.selectedProfile['name'].trim().replace(/[^A-Za-z0-9]+/g,'-')
          else
            this.selectedProfileId = (state.selectedProfile['givenName'] + ' ' + state.selectedProfile['familyName']).trim().replace(/[^A-Za-z0-9]+/g,'-');
          this.profileType = state.selectedProfile['@id'].split('/')[1];
          this.userId = state.selectedProfile['@id'].split('/')[2];
          this.ProfileIdService.setProfileId(state.selectedProfile['@id']);
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

   activateProfile(profile, $event) {
    $event.preventDefault();
    // TODO: activate profile API call
    this.appSrv.setSelectedProfile(profile);
  }

  getProfile() {
    let resourcePath = this.routeParams.get('@id');
    this.profileService.get(resourcePath).subscribe(
      (response: ProfileEditLDModel) => {
        this.profile = response;
      },
      (error) => {
        console.log('ERROR ', error);
      }
    );
  }

  isRoute(linkParams: any[]): boolean {
    return this.router.parent.isRouteActive(this.router.generate(linkParams));
  }

  isMyProfile() {
    return this.isRoute(['/MyProfiles']);
  }

  editProfile(profile, $event) {
    $event.preventDefault();
    this.appSrv.setSelectedProfile(profile);
    let proName: string = '';
    if(profile['@id'].split('/')[1] == 'vendors' || profile['@id'].split('/')[1] == 'institutions')
      proName = profile['name']
    else
      proName = profile['givenName'] + ' ' + profile['familyName'];
    this.router.navigate(['EditProfile', { type: profile['@id'].split('/')[1], '@id': proName.trim().replace(/[^A-Za-z0-9]+/g,'-'), uId: profile['@id'].split('/')[2] }]);
  }

goToProfile(profile, $event) {
    $event.preventDefault();
    this.appSrv.setSelectedProfile(profile);
    let proName: string = '';
    if(profile['@id'].split('/')[1] == 'vendors' || profile['@id'].split('/')[1] == 'institutions')
      proName = profile['name']
    else
      proName = profile['givenName'] + ' ' + profile['familyName'];
    this.router.navigate(['ProfilePreview', { type: profile['type'], id: proName.trim().replace(/[^A-Za-z0-9]+/g,'-'), uId: profile['@id'].split('/')[2] }]);
  }

  get isPreview() {
    return this.routeParams.get('id') === 'preview';
  }

  ngOnInit() {
    if (!this.profile) {
      this.getProfile();
    }
    let methodName = this.isMyProfile() ? 'myProfiles' : 'query';
    let id = this.routeParams.get('id');
    this.profileService[methodName]().subscribe(
      (response) => {
        // TODO: Build JsonLD model to instantiate from response
        this.profiles = response['hydra:member'];
      }
    );
  }

  comingSoon($event) {
      $event.preventDefault();

      this.notificationsSvc.push(new NotificationModel({
          message: `Coming soon!`,
          type: 'info'
      }));
  }
}
