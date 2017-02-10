import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs';
import 'rxjs/add/operator/share';
import {TokenManager, JwtTokenHelper} from './token-manager-service';
import {
  IProfileEditLD,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel
} from '../../profiles/models/profiles';
// import {ProfilesService} from '../../profiles/services/profiles-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {JobPostModel} from '../../job/post/models';
import {Utils, ArrayUtils} from '../../../url/utils/index';
import {IFeedFilter} from '../../feed/models';
import {SpacePostModel} from '../../spaces/post/models';

export interface IUser {
  username?: string;
  userId?: string;
  givenName?: string;
  familyName?: string;
  fullName?(): string;
}

export const ACTIONS: any = {
  PROFILE_SELECTED: 'PROFILE.SELECTED',
  AUTHENTICATION_CHANGE: 'AUTHENTICATION.CHANGE',
  SIGNED_IN: 'SIGNED.IN',
  SIGNED_OUT: 'SIGNED_OUT',
  MY_PROFILE_SET: 'MY_PROFILE_SET',
  PROFILE_JOBPOSTS_SET: 'PROFILE_JOBPOSTS_SET',
  FILTER_SET: 'FILTER_SET',
  SORT_SET: 'SORT_SET',
  TOGGLE_MENU_EXPANDED: 'TOGGLE_MENU_EXPANDED',
  PROFILE_SPACEPOSTS_SET: 'PROFILE_SPACEPOSTS_SET',
};

export interface IApp {
  action?: string;
  isAuthenticated: boolean;
  user?: IUser;
  selectedProfile?: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel;
  selectedProfileJobPosts?: JobPostModel[];
  myProfiles?: (ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel)[];
  jobFilter: IFeedFilter;
  profileFilter: IFeedFilter;
  sort: IFeedFilter;
  defaultAvatar: string;
  isMenuExpanded: boolean;
  selectedProfileSpacePosts?: SpacePostModel[];
  spaceFilter: IFeedFilter;
};

export class UserModel implements IUser {
  username: string;
  userId: string;
  givenName: string;
  familyName: string;

  constructor(public user: IUser = {}) {
    Object.assign(this, user);
  }

  fullName() {
    return [this.givenName, this.familyName].join(' ');
  }
};

export const DEFAULTS: IApp = {
  isAuthenticated: false,
  user: new UserModel(),
  myProfiles: [],
  selectedProfileJobPosts: [],
  jobFilter: {},
  profileFilter: {},
  sort: {},
  defaultAvatar: Utils.getRandomDefaultImage(),
  isMenuExpanded: true,

  selectedProfileSpacePosts: [],
  spaceFilter: {},
};

@Injectable()
export class AppService {
  public $stream: BehaviorSubject<IApp>;
  private _observer: any;
  // Application state representation
  private _data: IApp = Object.assign({}, DEFAULTS);

  constructor(
    private jwtHelper: JwtTokenHelper,
    private tokenManager: TokenManager
    // private profilesSrv: ProfilesService,
    // private notificationsSvc: NotificationsCollection
  ) {
    this.initData();
    this.$stream = new BehaviorSubject(this._data);
  }

  initData() {
    this._data = Object.assign({}, DEFAULTS);
    this._data.defaultAvatar = Utils.getRandomDefaultImage();
  }

  set(state: IApp): IApp {
    let data = Object.assign({}, this._data, state);
    return this._setData(data);
  }

  setToken(token: string) {
    let isValidToken;
    try {
      isValidToken = !this.jwtHelper.isTokenExpired(token);
    } catch (e) {
      console.error('Invalid token ', e);
      isValidToken = false;
    }
    return this.setAuthenticated(isValidToken);
  }

  signout() {
    this.tokenManager.invalidate();
    this.setToken(this.tokenManager.get());
    this.initData();
  }
  setAuthenticated(isAuthenticated: boolean) {
    let data = Object.assign(this._data);
    data.isAuthenticated = !!isAuthenticated;
    data.action = ACTIONS.AUTHENTICATION_CHANGE;
    if (!!isAuthenticated) {
      try {
        let decodedToken = this.jwtHelper.decodeToken(this.tokenManager.get());
        data.user.username = decodedToken.username;
        data.user.userId = decodedToken.userId;
      } catch (e) { }
    } else { // signed out user - clear everything
      data = Object.assign({}, data, DEFAULTS);
    }
    return this._setData(data);
  }

  setUser(user: IUser) {
    let data = Object.assign(this._data);
    data.user = new UserModel(user);
    return this._setData(data);
  }

  getUser() {
    return this._data.user;
  }

  setSelectedProfile(
    profile?: ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel
  ) {
    let data = Object.assign(this._data);
    data.selectedProfile = profile;
    data.action = ACTIONS.PROFILE_SELECTED;
    return this._setData(data);
  }

  setSelectedProfileJobPosts(jobposts: JobPostModel[] = []) {
    let data = Object.assign(this._data);
    data.selectedProfileJobPosts = jobposts;
    data.action = ACTIONS.PROFILE_JOBPOSTS_SET;
    return this._setData(data);
  }

  addSelectedProfileJobPost(jobpost: JobPostModel) {
    let data = Object.assign(this._data);
    data.selectedProfileJobPosts = [...data.selectedProfileJobPosts, jobpost];
    data.action = ACTIONS.PROFILE_JOBPOSTS_SET;
    return this._setData(data);
  }

  removeSelectedProfileJobPost(jobpost: JobPostModel) {
    let data = Object.assign(this._data);
    data.selectedProfileJobPosts = ArrayUtils.remove(data.selectedProfileJobPosts, jobpost);
    data.action = ACTIONS.PROFILE_JOBPOSTS_SET;
    return this._setData(data);
  }

  // spaces

  setSelectedProfileSpacePosts(spaceposts: SpacePostModel[] = []) {
    let data = Object.assign(this._data);
    data.selectedProfileSpacePosts = spaceposts;
    data.action = ACTIONS.PROFILE_SPACEPOSTS_SET;
    return this._setData(data);
  }

  addSelectedProfileSpacePost(spacepost: SpacePostModel) {
    let data = Object.assign(this._data);
    data.selectedProfileSpacePosts = [...data.selectedProfileSpacePosts, spacepost];
    data.action = ACTIONS.PROFILE_SPACEPOSTS_SET;
    return this._setData(data);
  }

  removeSelectedProfileSpacePost(spacepost: SpacePostModel) {
    let data = Object.assign(this._data);
    data.selectedProfileSpacePosts = ArrayUtils.remove(data.selectedProfileSpacePosts, spacepost);
    data.action = ACTIONS.PROFILE_SPACEPOSTS_SET;
    return this._setData(data);
  }

  // end new spaces

  setMyProfiles(
    myProfiles: (ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel)[]
  ) {
    let data = Object.assign(this._data);
    data.myProfiles = [...myProfiles];
    data.action = ACTIONS.MY_PROFILE_SET;
    if (!data.selectedProfile && myProfiles.length) {
      this.setSelectedProfile(myProfiles[0]);
    }
    return this._setData(data);
  }

  setJobFilter(filter: IFeedFilter = {}) {
    let data = Object.assign(this._data);
    data.jobFilter = Object.assign({}, filter);
    data.action = ACTIONS.FILTER_SET;
    return this._setData(data);
  }

  getJobFilter(): IFeedFilter {
    return Object.assign({}, this._data.jobFilter);
  }




  // space filter

  setSpaceFilter(filter: IFeedFilter = {}) {
    let data = Object.assign(this._data);
    data.spaceFilter = Object.assign({}, filter);
    data.action = ACTIONS.FILTER_SET;
    return this._setData(data);
  }

  getSpaceFilter(): IFeedFilter {
    return Object.assign({}, this._data.spaceFilter);
  }

  // end space filter



  setProfileFilter(filter: IFeedFilter = {}) {
    let data = Object.assign(this._data);
    data.profileFilter = Object.assign({}, filter);
    data.action = ACTIONS.FILTER_SET;
    return this._setData(data);
  }

  getProfileFilter(): IFeedFilter {
    return Object.assign({}, this._data.profileFilter);
  }

  setSort(sort: IFeedFilter = {}) {
    let data = Object.assign(this._data);
    data.sort = Object.assign({}, sort);
    // Update filters
    data.profileFilter = Object.assign({}, data.profileFilter, sort);
    data.jobFilter = Object.assign({}, data.jobFilter, sort);
    data.spaceFilter = Object.assign({}, data.spaceFilter, sort);
    data.action = ACTIONS.SORT_SET;
    return this._setData(data);
  }

  toggleMenuExpanded() {
    let data = Object.assign(this._data);
    data.isMenuExpanded = !data.isMenuExpanded;
    data.action = ACTIONS.TOGGLE_MENU_EXPANDED;
    return this._setData(data);
  }

  setMenuExpanded(isMenuExpanded: boolean = true) {
    let data = Object.assign(this._data);
    data.isMenuExpanded = isMenuExpanded;
    data.action = ACTIONS.TOGGLE_MENU_EXPANDED;
    return this._setData(data);
  }

  /**
   * Function responsible for setting newly calculated data and notifying observers.
   */
  private _setData(data: IApp = DEFAULTS) {
    this._data = Object.assign({}, DEFAULTS, data);
    // this._observer.next(data);
    this.$stream.next(data);
    return data;
  }

  get activeProfileName() {
    return this._data.selectedProfile && this._data.selectedProfile.toString();
  }

  get activeProfileUserId() {
    return this._data.selectedProfile && this._data.selectedProfile['createdBy'];
  }

  /* tslint:disable */
  getActiveProfile(): ProfileInstitutionModel | ProfileVendorModel | ProfileProfessionalModel {
    return this._data.selectedProfile;
  }
  /* tslint:enable */

  get defaultAvatar() {
    return this._data.defaultAvatar;
  }

  get isMenuExpanded() {
    return this._data.isMenuExpanded;
  }
}
