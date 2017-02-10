import { Component, OnInit, Input, OnDestroy } from 'angular2/core';
import { RouteConfig, Router, RouteParams, ROUTER_DIRECTIVES } from 'angular2/router';
import { JsonPipe, NgClass, NgStyle } from 'angular2/common';
import { Subscription } from 'rxjs/Subscription';
import { Auth } from '../authentication/services/auth-service';
import { AppService, IApp, DEFAULTS } from '../authentication/services/app-service';
import { ROUTES, FEED_TYPES } from '../../constants';
import { JobPostsService } from '../job/services/jobposts-service';
import { SearchModal } from '../search/modal/search';
import { FallbackImgDirective } from '../../url/components/fallbackimg';
import { ProfileEditLDModel } from '../profiles/models/profiles';
import { ProfileIdService } from '../projects/services/projects-service';

@Component({
  selector: 'af-header',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    NgStyle,
    SearchModal,
    FallbackImgDirective
  ],
  providers: [Auth, JobPostsService],
  pipes: [JsonPipe],
  styles: [require('./header.css')],
  template: require('./header.html')
})
export class Header implements OnInit, OnDestroy {
  @Input() profile: ProfileEditLDModel;
  state: IApp = DEFAULTS;
  state$: Subscription<IApp>;
  profileType: string = '';
  userId: string = '';
  signout$: Subscription<any>;
  myJobPosts$: Subscription<any>;
  selectedProfileId: string = '';
  FEED_TYPES: any = FEED_TYPES;
  searchModal: any = {
    title: 'Search AF',
    hideOnClose: true,
  };
  routerLink: any;
  constructor(
    public router: Router,
    public auth: Auth,
    public appSrv: AppService,
    public jobPostsService: JobPostsService,
    public ProfileIdService: ProfileIdService
  ) {
    this.appSrv.$stream
      .subscribe((state) => {
        console.log('State: ' + state.selectedProfile);
        this.state = state;
        if (state.selectedProfile) {
          this.profileType = state.selectedProfile['@id'].split('/')[1];
          if (this.profileType == 'vendors' || this.profileType == 'institutions')
            this.selectedProfileId = state.selectedProfile['name'].trim().replace(/[^A-Za-z0-9]+/g, '-')
          else
            this.selectedProfileId = (state.selectedProfile['givenName'] + ' ' + state.selectedProfile['familyName']).trim().replace(/[^A-Za-z0-9]+/g, '-');
          this.profileType = state.selectedProfile['@id'].split('/')[1];
          this.userId = state.selectedProfile['@id'].split('/')[2];
          this.ProfileIdService.setProfileId(state.selectedProfile['@id']);
          let routerLinkArray = [];
          routerLinkArray[0] = 'EditProfile';
          routerLinkArray[1] = { type: this.profileType, id: this.selectedProfileId + '?uId=' + this.userId };
          routerLinkArray[2] = this.userId;
          this.routerLink = routerLinkArray;
        }
      });
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.state$.unsubscribe();
    this.signout$.unsubscribe();
    this.myJobPosts$.unsubscribe();
  }

  signout($event) {
    $event.preventDefault();
    this.signout$ = this.auth.signout().subscribe(
      () => {
        this.router.navigate(ROUTES.POST_SIGNOUT_ROUTE);
      },
      (err) => {
        console.log('Signout UNSuccessful!');
      }
    );
  }

  activateProfile(profile, $event) {
    $event.preventDefault();
    // TODO: activate profile API call
    this.appSrv.setSelectedProfile(profile);
    this.fetchProfileJobPosts(profile);
  }

  fetchProfileJobPosts(profile) {
    let query = profile.getMyProfileQuery();
    this.myJobPosts$ = this.jobPostsService
      .myJobPosts(query.type, query.value)
      .subscribe(
      (response) => {
        // this.jobposts = response['hydra:member'];
        this.appSrv.setSelectedProfileJobPosts(response['hydra:member']);
      }
      );
    // TODO: get jobPosts for the profile
    // Set this.appSrv.setActiveProfileJobPosts(jobPosts);
    // TODO: component for printing Nr of JobPosts - subscribed to appState.activeProfileJobPosts
  }

  showSearchModal($event) {
    $event.preventDefault();
    this.searchModal.opened = true;
  }

  onSearchModalHide($event) {
    this.searchModal.opened = false;
  }

  editProfile($event) {
    $event.preventDefault();
    // this.appSrv.setSelectedProfile(profile);
    // this.router.navigate(['EditProfile', { '@id': profile['@id'] }]);
    let userName = '';
    if (this.state && this.state.selectedProfile) {
      //this.router.navigate(this.state.selectedProfile.getRouterLink());
      if (this.profileType == 'vendors' || this.profileType == 'institutions')
        userName = this.state.selectedProfile['name']
      else
        userName = this.state.selectedProfile['givenName'] + ' ' + this.state.selectedProfile['familyName'];

      this.router.navigate(['EditProfile', { type: this.state.selectedProfile['@id'].split('/')[1], '@id': userName.trim().replace(/[^A-Za-z0-9]+/g, '-'), uId: this.state.selectedProfile.id }]);
    }
  }

  goToProfile($event) {
    $event.preventDefault();
    let userName = '';
    if (this.state && this.state.selectedProfile) {
      //this.router.navigate(this.state.selectedProfile.getRouterLink());
      if (this.profileType == 'vendors' || this.profileType == 'institutions')
        userName = this.state.selectedProfile['name']
      else
        userName = this.state.selectedProfile['givenName'] + ' ' + this.state.selectedProfile['familyName'];

      this.router.navigate(['ProfilePreview', { type: this.state.selectedProfile.type, id: userName.trim().replace(/[^A-Za-z0-9]+/g, '-'), uId: this.state.selectedProfile.id }]);
    }
  }

  setId(id) {
    this.ProfileIdService.setProfileId(this.state.selectedProfile.id);
  }
  // checkIfReload($event, linkParams?: any[]) {
  //   $event.preventDefault();
  //   if (linkParams) {
  //     let instruction = this.router.generate(linkParams);
  //     if (instruction) {
  //       let url = instruction.toLinkUrl();
  //       if (this.router.lastNavigationAttempt === '/' + url) {
  //         this.router.renavigate();
  //       }
  //     }
  //   }
  // }
}
