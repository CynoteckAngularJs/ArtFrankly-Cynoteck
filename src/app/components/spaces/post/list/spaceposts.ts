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
import {Profile} from '../../../profiles/profile/profile';
import {FormatDatePipe} from '../../../../url/pipes/pipes';
import {SpacePostModel} from '../models';
import {SpacePostsService} from '../../services/spaceposts-service';
import {AppService, ACTIONS} from '../../../authentication/services/app-service';
import {checkIfHasPermission} from '../../../authentication/services/token-manager-service';
import {
  IProfileEditLD,
  IProfessionalGeneral,
  IInstitutionGeneral,
  IVendorGeneral,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel,
  BaseProfile
} from '../../../profiles/models/profiles';
import {NotificationsCollection} from '../../../notifications/services/notifications';
import {NotificationModel} from '../../../notifications/notification/notification';
import {ReplyDetails} from '../reply/details/reply';
import {Utils} from '../../../../url/utils/index';
import {SPACE_POST_STATES} from '../../../../constants';
import {FeedFilterButtonGroup} from '../../../feed/filter/general/filter';

@Component({
  selector: 'my-spaceposts',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Profile, ReplyDetails, FeedFilterButtonGroup],
  pipes: [FormatDatePipe],
  providers: [SpacePostsService],
  styles: [ require('./spaceposts.css') ],
  template: require('./spaceposts.html')
})
@CanActivate(checkIfHasPermission)
export class MySpacePosts implements OnInit {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() spaceposts: SpacePostModel[] = [];
  @Input() archivedSpaceposts: SpacePostModel[] = [];
  @Input() select: string;
  mySpacePosts$: Subscription<SpacePostModel[]>;
  profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel;
  profileFieldType: string;
  profileFieldValue: string;
  // space post ids of all expanded spaceposts
  expandedResponses: any = {};
  SPACE_POST_STATES: any = SPACE_POST_STATES;

  constructor(
      public router: Router,
      public location: Location,
      public routeParams: RouteParams,
      public spacepostsService: SpacePostsService,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection
  ) {
    let selectedProfileDisposable = this.appSrv.$stream
      .map((state) => state.selectedProfile)
      .subscribe((profile) => this.onProfileUpdate(profile));
  }

  onProfileUpdate(profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel) {
    if (profile) {
      let myProfileQuery = profile.getMyProfileQuery();
      this.profileFieldType = myProfileQuery.type;
      this.profileFieldValue = myProfileQuery.value;
      this.getMySpacePosts();
    }
  }

  ngOnInit() {}

  getMySpacePostsHandler($event) {
    $event.preventDefault();
    this.getMySpacePosts();
  }

  getMySpacePosts() {
    if (this.profileFieldType && this.profileFieldValue) {
      this.spacepostsService.mySpacePosts(this.profileFieldType, this.profileFieldValue)
        .subscribe(
          (response) => {
            this.spaceposts = response['hydra:member'];
          }
        );
      this.getArchivedSpacePosts();
    }
  }

  getArchivedSpacePosts() {
    if (this.profileFieldValue) {
      this.spacepostsService.profileArchivedSpacePosts(this.profileFieldValue)
          .subscribe(
            (response) => {
              this.archivedSpaceposts = response['hydra:member'];
            }
          );
    }
  }

  archiveSpacePost($event, spacepost: SpacePostModel) {
    $event.preventDefault();
    this.spacepostsService.archive(spacepost.id)
      .subscribe(
        (response) => {
          this.notificationsSvc.push(new NotificationModel({
              message: `Space Post has been archived!`,
              type: 'success'
            }));
          // TODO: remove spacepost item from the list
          let appState = this.appSrv.removeSelectedProfileSpacePost(spacepost);
          this.spaceposts = [...appState.selectedProfileSpacePosts];
          this.getArchivedSpacePosts();
        },
        (error) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while archiving space post!`,
            type: 'danger'
          }));
          // Utils.scrollTop();
        }
      );
  }

  toggleAllResponses(spacepostId, $event) {
    $event.preventDefault();
    this.expandedResponses[spacepostId] = !!!this.expandedResponses[spacepostId];
  }

  goToArchived($event) {
    $event.preventDefault();
    Utils.scrollTo('#archivedSpacePosts');
  }

  onPublish($event, spacepost: SpacePostModel) {
    $event.preventDefault();
    if (spacepost.id) {
      this.spacepostsService.publish(spacepost.id).subscribe(
        (response) => {
          spacepost.state = response.state;
        }
      );
    }
  }
}
