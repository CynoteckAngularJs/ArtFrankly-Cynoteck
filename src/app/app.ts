/*
 * Angular 2 decorators and services
 */
import {Observable} from 'rxjs/Observable';
import {Component, OnInit, OnDestroy, ElementRef, ViewChild, Input} from 'angular2/core';
import {RouteConfig, Router, ROUTER_DIRECTIVES} from 'angular2/router';
import {FORM_PROVIDERS, JsonPipe, AsyncPipe, NgClass} from 'angular2/common';
import {Subscription} from 'rxjs/Subscription';
import {Home} from './home/home';
import {Header} from './components/header/header';
import {Footer} from './components/footer/footer';
import {Signin} from './components/authentication/signin/signin';
import {SigninModal} from './components/authentication/signin/signin.modal';
import {Signup} from './components/authentication/signup/signup';
import {SignupModal} from './components/authentication/signup/signup.modal';
import {Profiles} from './components/profiles/profiles';
import {MyProfiles} from './components/profiles/myprofiles';
import {Profile} from './components/profiles/profile/profile';
import {EditProfile} from './components/profiles/editprofile/editprofile';
import {ProfilePreview} from './components/profiles/details/profile';
import {ProfilesService} from './components/profiles/services/profiles-service';
import {JobPost} from './components/job/post/details/jobpost';
import {EditJobPost} from './components/job/post/edit/jobpost';
import {NotificationsCollection} from './components/notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from './components/notifications/notification/notification';
import {Modal, IModal} from './components/modal/modal';
import {SidebarMenu} from './components/menus/sidebar/sidebar-menu';
import {
  ISidebarMenuItem,
  SidebarMenuItem
} from './components/menus/sidebar/sidebar-menu-item/sidebar-menu-item';
import {AppService, IApp, ACTIONS} from './components/authentication/services/app-service';
import {TokenManager} from './components/authentication/services/token-manager-service';
import {MENU_DATA} from './components/menus/sidebar/sidebar-menu-data';
import {Onboarding} from './components/wizard/onboarding';
import {MyJobPosts} from './components/job/post/list/jobposts';
import {JobPostReply} from './components/job/post/reply/reply';
import {Feeds} from './components/feed/list/feeds';
import {Utils} from './url/utils/index';
import {PaypalCanceledHandler, PaypalHandler} from './components/paypal/paypal';
import {JobPostPaymentShareModal} from './components/job/post/payment-share/modal';
import {JobPostReplyMessages} from './components/job/post/messaging/list/messages';
import {MyJobPostsResponses} from './components/job/post/list/responses/myjobpostresponses';
import {RequestEmailModal} from './components/lost-password/request-email/request.modal';
import {ResetPasswordModal} from './components/lost-password/reset-password/reset.modal';
import {ChangePasswordModal} from './components/change-password/change-password/change.modal';
import {SearchModal} from './components/search/modal/search';
import {FooterPages} from './components/footer-pages/index';
import {INTERCOM_API_ID} from './config';
import {MyLanding} from './components/job/post/landing/job-landing';
import {ProfileIdService} from './components/projects/services/projects-service';

import {MySpacePosts} from './components/spaces/post/list/spaceposts';
import {SpacePost} from './components/spaces/post/details/spacepost';
import {EditSpacePost} from './components/spaces/post/edit/spacepost';
import {SpacePostReply} from './components/spaces/post/reply/reply';
import {SpacePostPaymentShareModal} from './components/spaces/post/payment-share/modal';
import {SpacePostReplyMessages} from './components/spaces/post/messaging/list/messages';
import {MySpacePostsResponses} from './components/spaces/post/list/responses/myspacepostresponses';


declare var jQuery: any;
declare var ga: any;

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  providers: [...FORM_PROVIDERS, TokenManager,ProfileIdService],
  directives: [
    ...ROUTER_DIRECTIVES,
    Header,
    Footer,
    Notification,
    Profiles,
    MyProfiles,
    JobPost,
    SpacePost,
    SidebarMenu,
    SidebarMenuItem,
    NgClass,
    Modal
  ],
  pipes: [JsonPipe, AsyncPipe],
  styles: [require('./app.css')],
  template: require('./app.html')
})
/* tslint:disable */
@RouteConfig([
  { path: '/', component: Home, name: 'Home' },
  //{ path: '/home', component: Home, name: 'Home' },
  { path: '/signin', component: SigninModal, name: 'Signin' },
  { path: '/signup', component: SignupModal, name: 'Signup' },
  { path: '/onboarding', component: Onboarding, name: 'Onboarding' },
  { path: '/feed', component: Feeds, name: 'Feeds' },
  // { path: '/search/:term', component: SearchModal, name: 'SearchModal' },
  { path: '/my/profiles', component: MyProfiles, name: 'MyProfiles' },
  { path: '/profiles/add', component: EditProfile, name: 'AddProfile' },
  { path: '/preview/profiles/:type/:id', component: ProfilePreview, name: 'ProfilePreview' },
  { path: '/profiles/:@id', component: Profile, name: 'Profile' },
  { path: '/profiles/:type/:@id/edit', component: EditProfile, name: 'EditProfile' },
  // { path: '/profiles', component: Profiles, name: 'Profiles' },
  { path: '/my/jobposts', component: MyJobPosts, name: 'MyJobPosts' },
  { path: '/my/landing/job-landing', component: MyLanding, name: 'MyLanding' },
  { path: '/my/responses', component: MyJobPostsResponses, name: 'MyJobPostsResponses' },
  { path: '/jobposts/add', component: EditJobPost, name: 'AddJobPost' },
  { path: '/jobposts/:id', component: JobPost, name: 'JobPost' },
  { path: '/jobposts/:id/edit', component: EditJobPost, name: 'EditJobPost' },
  { path: '/jobposts/:id/reply', component: JobPostReply, name: 'JobPostReply' },
  { path: '/jobposts/:id/reply/:jobresponseId/messages', component: JobPostReplyMessages, name: 'JobPostReplyMessages' },
  { path: '/jobposts/:id/payment/success', component: JobPostPaymentShareModal, name: 'JobPostPaymentSuccess' },
  { path: '/modal', component: Modal, name: 'Modal' },
  { path: '/created_payment', component: PaypalHandler, name: 'PaypalHandler' },
  { path: '/canceled_payment', component: PaypalCanceledHandler, name: 'PaypalCanceledHandler' },
  { path: '/lost-password', component: RequestEmailModal, name: 'LostPassword' },
  { path: '/reset-password/:token', component: ResetPasswordModal, name: 'ResetPassword' },
  { path: '/change-password', component: ChangePasswordModal, name: 'ChangePassword' },
  { path: '/pages', component: FooterPages, name: 'FooterPages' },
  { path: '/pages/:slug', component: FooterPages, name: 'FooterPages' },
  { path: '/my/spaceposts', component: MySpacePosts, name: 'MySpacePosts' },
  { path: '/my/spaceresponses', component: MySpacePostsResponses, name: 'MySpacePostsResponses' },
  { path: '/spaceposts/add', component: EditSpacePost, name: 'AddSpacePost' },
  { path: '/spaceposts/:id', component: SpacePost, name: 'SpacePost' },
  { path: '/spaceposts/:id/edit', component: EditSpacePost, name: 'EditSpacePost' },
  { path: '/spaceposts/:id/reply', component: SpacePostReply, name: 'SpacePostReply' },
  { path: '/spaceposts/:id/reply/:spaceresponseId/messages', component: SpacePostReplyMessages, name: 'SpacePostReplyMessages' },
  { path: '/spaceposts/:id/payment/success', component: SpacePostPaymentShareModal, name: 'SpacePostPaymentSuccess' },
  { path: '/**', redirectTo: ['Home'] }
])
/* tslint:enable */
export class App implements OnInit, OnDestroy {
  notifications: Observable<NotificationModel[]>;
  menu: ISidebarMenuItem = MENU_DATA;
  state: IApp;
  isAuth$: Subscription<boolean>;
  state$: Subscription<[any]>;
  currentPage: string;
  $el: any;
  // menuExpanded: boolean;
  isShowAside: boolean = false;
  isExpaded$: Subscription<boolean>;
  @ViewChild(Header) headerCmp;
  profileSelected$: Subscription<[any]>;
  isIntercomBooted: boolean = false;

  constructor(
    public notificationsSrv: NotificationsCollection,
    public appSrv: AppService,
    private router: Router,
    private tokenManager: TokenManager,
    private profilesSrv: ProfilesService,
    public ProfileIdService:ProfileIdService,
    private el: ElementRef
  ) {
    this.appSrv.$stream
      .subscribe((state) => {
        this.state = state;
        if (state.selectedProfile) {
          this.ProfileIdService.setProfileId(state.selectedProfile['@id']);
        }
      });

  }

  ngOnInit() {
    this.notifications = this.notificationsSrv.$stream;
    this.state$ = this.appSrv.$stream
      .subscribe((state) => this.state = state);
    this.appSrv.setToken(this.tokenManager.get());

    // TODO: on isAuthenticated changes get myprofiles
    this.isAuth$ = this.appSrv.$stream
      .filter((state) => state.action === ACTIONS.AUTHENTICATION_CHANGE)
      .subscribe((state) => {
        if (state.isAuthenticated) {
          this.isIntercomBooted ? this.intercomUpdate() : this.intercomSetup();
          this.profilesSrv.myProfiles()
            .subscribe((profiles) => {
              this.appSrv.setMyProfiles(profiles['hydra:member']);
              this.headerCmp.fetchProfileJobPosts(this.appSrv.getActiveProfile());
            });
        } else {
          this.appSrv.setMyProfiles([]);
          this.intercomShutdown();
        }
      });
    this.isExpaded$ = this.appSrv.$stream
      .filter((state) => state.action === ACTIONS.TOGGLE_MENU_EXPANDED)
      .map((state) => state.isMenuExpanded)
      .subscribe((isMenuExpanded) => this.onExpandedToggle(isMenuExpanded));
    this.profileSelected$ = this.appSrv.$stream
      .filter((state) => state.action === ACTIONS.PROFILE_SELECTED)
      .map((state) => state.selectedProfile)
      .subscribe((selectedProfile) => this.onProfileSelected(selectedProfile));
    this.router.subscribe((value) => this.onRouteChange(value));
    this.$el = jQuery(this.el.nativeElement);
    // this.onToggled({ opened: this.menuExpanded });
    this.postStartup();
  }

  ngOnDestroy() {
    this.isAuth$.unsubscribe();
    this.state$.unsubscribe();
    this.isExpaded$.unsubscribe();
    this.profileSelected$.unsubscribe();
  }

  isPage(linkParams) {
    return this.router.isRouteActive(this.router.generate(linkParams));
  }

  onRouteChange(value) {
    // TODO: Remove below workarround (for coming to index.html W/O hash)
    // value = value && value.length ? value : 'home';
    value = value && value.length ? value.indexOf('term') > -1 ? 'feed' : value : 'home';
    if (this.el) {
      let $el = jQuery(this.el.nativeElement);
      $el.removeClass(this.currentPage).addClass(value);
      this.currentPage = value;
    }
    this.isShowAside = this._isShowAside(value);
    // this.appSrv.setMenuExpanded(this.isShowAside && this.appSrv.isMenuExpanded);
    if (!this.isShowAside) {
      this.onExpandedToggle(false);
    } else {
      this.onExpandedToggle(this.appSrv.isMenuExpanded);
    }
    // TODO: set isMenuExpanded based on route!
    // this.onToggled({ opened: this.menuExpanded || this.isShowAside });
    Utils.scrollTop();

    if (this.appSrv.getUser().username) {
      ga('set', 'userId', this.appSrv.getUser().username);
    }
    ga('send', 'pageview', value);
  }

  onToggled($event: { opened?: boolean }) {
    // let isExpanded = $event.opened && this._isShowAside();
    // isExpanded ? this.$el.addClass('menu-expanded') : this.$el.removeClass('menu-expanded');
    // this.menuExpanded = isExpanded;
    this.appSrv.setMenuExpanded($event.opened);
    // this.appSrv.toggleMenuExpanded();
  }

  onExpandedToggle(isMenuExpanded: boolean) {
    isMenuExpanded ? this.$el.addClass('menu-expanded') : this.$el.removeClass('menu-expanded');
  }

  _isShowAside(cInstrPath?: string) {
    cInstrPath = cInstrPath || this.currentPage || '';
    // only authenticated users can see the sidebar
    // on all pages except of Home & FooterPages
    return this.state.isAuthenticated &&
        (!cInstrPath.startsWith('home') &&
        !cInstrPath.startsWith('pages'));
  }

  onProfileSelected(selectedProfile) {
    if (this.isIntercomBooted) {
      this.intercomUpdate({
        type: selectedProfile.type,
        name: selectedProfile.toString(),
        email: selectedProfile.email,
        // user_id: selectedProfile['@id']
        user_id: Utils.extractIdFromIRI(selectedProfile.user)
      });
    }
  }

  postStartup() {
    this.intercomSetup();
  }

  getIntercomConfiguration() {
    let intercomConfig: any = {
        app_id: INTERCOM_API_ID
      };
    let user = this.appSrv.getUser();
    if (user.username) {
      intercomConfig.email = user.username;
      intercomConfig.created_at = (new Date()).getTime();
      // intercomConfig.name = this.appSrv.getUser().toString();
      intercomConfig.user_id = user.userId;
    }
    return intercomConfig;
  }

  intercomSetup() {
    (<any> window).Intercom('boot', this.getIntercomConfiguration());
    this.isIntercomBooted = true;
  }

  intercomUpdate(config: any = {}) {
    let intercomConf = this.getIntercomConfiguration();
    (<any> window).Intercom('update', Object.assign({}, intercomConf, config));
  }

  intercomShutdown() {
    (<any> window).Intercom('shutdown');
    this.isIntercomBooted = false;
  }
}

/*
 * Please review the https://github.com/AngularClass/angular2-examples/ repo for
 * more angular app examples that you may copy/paste
 * (The examples may not be updated as quickly. Please open an issue on github for us to update it)
 * For help or questions please contact us at @AngularClass on twitter
 * or our chat on Slack at https://AngularClass.com/slack-join
 * or via chat on Gitter at https://gitter.im/AngularClass/angular2-webpack-starter
 */

