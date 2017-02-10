import {Subscription} from 'rxjs/Subscription';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  AfterViewInit,
  ElementRef
} from 'angular2/core';
import {FORM_DIRECTIVES, JsonPipe} from 'angular2/common';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {
  SidebarMenuItem,
  ISidebarMenuItem,
  DEFAULTS,
  SidebarMenuItemModel
} from './sidebar-menu-item/sidebar-menu-item';
import {
  ProfileEditLDModel,
  BaseProfile,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel
} from '../../profiles/models/profiles';
import {AppService, IApp, ACTIONS} from '../../authentication/services/app-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {MENU_DATA} from './sidebar-menu-data';
import {Utils} from '../../../url/utils/index';
import {MyJobPostsResponses} from '../../job/post/list/responses/myjobpostresponses';
import {ProfileIdService} from '../../projects/services/projects-service';

declare var jQuery: any;

@Component({
  selector: 'sidebar-menu',
  directives: [...FORM_DIRECTIVES, ...ROUTER_DIRECTIVES, SidebarMenuItem, SidebarMenu],
  pipes: [JsonPipe],
  styles: [ require('./sidebar-menu.css') ],
  template: require('./sidebar-menu.html'),
  encapsulation: ViewEncapsulation.None
})
export class SidebarMenu implements OnInit, AfterViewInit, OnDestroy {
  @Input() menu: SidebarMenuItemModel;
  /* tslint:disable */
  @Input() profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel = new ProfileProfessionalModel();
  /* tslint:enable */
  @Output() toggled: EventEmitter<any> = new EventEmitter();
  cachedMenu: Map<string, SidebarMenuItemModel> = new Map<string, SidebarMenuItemModel>();
  opened: boolean = true;
  _element: any;
  activeProfileJobPosts$: Subscription<any>;
  isExpaded$: Subscription<boolean>;

  constructor(
    public router: Router,
    private appSrv: AppService,
    private _elementRef : ElementRef,
    private notificationsSvc: NotificationsCollection,
    public ProfileIdService: ProfileIdService
  ) {
    this._element = jQuery(_elementRef.nativeElement);
    this.activeProfileJobPosts$ = this.appSrv.$stream
        .map((state) => state.selectedProfileJobPosts)
        .subscribe((jobPosts) => this.onJobPostsSet(jobPosts));
    this.isExpaded$ = this.appSrv.$stream
      .filter((state) => state.action === ACTIONS.TOGGLE_MENU_EXPANDED)
      .map((state) => state.isMenuExpanded)
      .subscribe((isMenuExpanded) => this.opened = isMenuExpanded);
  }

  ngOnInit() {
    this.menu = this.menu;
    // this.setProfile('test);
    let selectedProfileDisp$ = this.appSrv.$stream
      .map((state) => state.selectedProfile)
      .subscribe((profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel) => {
        this.setProfile(profile);
      });
  }

  ngOnDestroy() {
    this.activeProfileJobPosts$.unsubscribe();
    this.isExpaded$.unsubscribe();
  }

resetFilter(){
  this.ProfileIdService.feed = null;
}

  ngAfterViewInit() {
    // jQuery(this._element).affix({
    //   offset: {
    //     top: 100,
    //     bottom: function () {
    //       return (this.bottom = jQuery('af-footer').outerHeight(true));
    //     }
    //   }
    // });
    jQuery(window).on('DOMContentLoaded load resize scroll', () => {
      let $footer = jQuery('footer.af-footer');
      let isFooterInView = Utils.inView($footer.get(0));
      let footerTop = $footer.get(0).getBoundingClientRect().top;
      let bottom = isFooterInView ? jQuery(window).height() - footerTop : 0;
      jQuery('aside.main-aside').css('bottom', bottom);
    });
    setTimeout(() => {
      this.attachComingSoonNotifications();
    }, 500);
  }

  goToAddProfile($event) {
    $event.preventDefault();
    this.appSrv.setSelectedProfile();
    this.router.navigate(['/AddProfile']);
  }

  setProfile(profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel) {
    this.profile = profile;
    if (profile) {
      let pnMenuItem: SidebarMenuItemModel = this.find('profile-name');
      let peMenuItem: SidebarMenuItemModel = this.find('edit-profile');
      let ppMenuItem: SidebarMenuItemModel = this.find('public-profile');
      if (this.profile && pnMenuItem && peMenuItem) {
        pnMenuItem.name = profile.toString();
        peMenuItem.linkParams.splice(0, pnMenuItem.linkParams.length);
        peMenuItem.linkParams = [...['/EditProfile', { '@id': profile['@id'] }]];
        // url = this.router.generate(['/EditProfile', { '@id': profile['@id'] }]).toLinkUrl(); 
      }
      if (this.profile && ppMenuItem) {
        ppMenuItem.linkParams = [...['/ProfilePreview', { id: profile.id, type: profile.type }]];
      }
    }
  }

  toggleMenu($event) {
    $event.preventDefault();
    this.opened = !this.opened;
    this.toggled.next({ opened: this.opened });
    // Trigger resize to resize things like owlCarousel or select2 ...
    window.dispatchEvent(new Event('resize'));

    if (this.opened) {
      setTimeout(() => {
        this.attachComingSoonNotifications();
      }, 500);
      this.attachComingSoonNotifications();
    } else {
      this.deAttachComingSoonNotifications();
    }
  }

  attachComingSoonNotifications() {
    //jQuery('.spaces-link a').on('click', (e) => this.comingSoon(e));
    //jQuery('.commissions-link a').on('click', (e) => this.comingSoon(e));
  }

  deAttachComingSoonNotifications() {
    //jQuery('.spaces-link a').off('click', (e) => this.comingSoon(e));
    //jQuery('.commissions-link a').off('click', (e) => this.comingSoon(e));
  }

  comingSoon($event) {
    $event.preventDefault();
    this.notificationsSvc.push(new NotificationModel({
      message: `Coming Soon!`,
      type: 'success'
    }));
  }

  /**
   * Find by doing first lookup in cache and if not found
   * there try searching menu tree. If menu item is found there
   * store it in cache and return it.
   */
  private find(id): SidebarMenuItemModel {
    let menuItem: SidebarMenuItemModel;
    if (this.cachedMenu.get(id)) {
      menuItem = this.cachedMenu.get(id);
    } else {
      if (this.menu) {
        menuItem = this.menu.find(id);
        if (menuItem) {
          this.cachedMenu.set(id, menuItem);
        }
      } else {
        menuItem = undefined;
      }
    }
    return menuItem;
  }

  // Workaround since cmp (activeprofilejobpostsnumber) is not evaluated!
  private onJobPostsSet(jobPosts = []) {
    this.updateJobPostNumber(jobPosts.length.toString());
  }

  private updateJobPostNumber(numberOfJobPosts: string) {
    let $item = jQuery('sidebar-menu-item#post-positions-placed [activeprofilejobpostsnumber]');
    if ($item && $item.length) {
      $item.text(numberOfJobPosts);
    }
  }
}


