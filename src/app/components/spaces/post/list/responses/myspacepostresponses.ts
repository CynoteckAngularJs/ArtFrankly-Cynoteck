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
import {Profile} from '../../../../profiles/profile/profile';
import {FormatDatePipe} from '../../../../../url/pipes/pipes';
import {SpacePostModel} from '../../models';
import {SpacePostsService} from '../../../services/spaceposts-service';
import {AppService, ACTIONS} from '../../../../authentication/services/app-service';
import {checkIfHasPermission} from '../../../../authentication/services/token-manager-service';
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
} from '../../../../profiles/models/profiles';
import {NotificationsCollection} from '../../../../notifications/services/notifications';
import {NotificationModel} from '../../../../notifications/notification/notification';
import {ReplyDetails} from '../../reply/details/reply';
import {MySpacePosts} from '../spaceposts';
import {SpacePostReplyModel} from '../../reply/models';
import {SPACE_POST_STATES} from '../../../../../constants';

@Component({
  selector: 'my-spaceposts',
  directives: [ ...ROUTER_DIRECTIVES, NgClass, Profile, ReplyDetails],
  pipes: [FormatDatePipe],
  providers: [SpacePostsService],
  styles: [ require('../spaceposts.css') ],
  template: require('./myspacepostresponses.html')
})
@CanActivate(checkIfHasPermission)
export class MySpacePostsResponses extends MySpacePosts {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() spaceposts: SpacePostModel[] = [];
  @Input() archivedSpaceposts: SpacePostModel[] = [];
  @Input() select: string;
  @Input() responses: SpacePostReplyModel[] = [];
  mySpacePosts$: Subscription<SpacePostModel[]>;
  profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel;
  profileFieldType: string;
  profileFieldValue: string;
  // space post ids of all expanded spaceposts
  expandedResponses: any = {};
  SPACE_POST_STATES: any = SPACE_POST_STATES;

  constructor(
      router: Router,
      location: Location,
      routeParams: RouteParams,
      spacepostsService: SpacePostsService,
      appSrv: AppService,
      notificationsSvc: NotificationsCollection
  ) {
    super(router, location, routeParams,
      spacepostsService, appSrv, notificationsSvc);
  }

  ngOnInit() {}

  getMySpacePosts() {
    if (this.profileFieldType && this.profileFieldValue) {
      let profileQuery = { profile: this.profileFieldValue };
      this.spacepostsService.mySpacePostsResponses(profileQuery)
        .subscribe(
          (response) => {
            this.responses = response['hydra:member'];
          }
        );
      // this.getArchivedSpacePosts();
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

  // archiveSpacePost($event, spacepost: SpacePostModel) {
  //   $event.preventDefault();
  //   this.spacepostsService.archive(spacepost.id)
  //     .subscribe(
  //       (response) => {
  //         this.notificationsSvc.push(new NotificationModel({
  //             message: `Space Post has been archived!`,
  //             type: 'success'
  //           }));
  //         // TODO: remove spacepost item from the list
  //         let appState = this.appSrv.removeSelectedProfileSpacePost(spacepost);
  //         this.spaceposts = [...appState.selectedProfileSpacePosts];
  //         this.getArchivedSpacePosts();
  //       },
  //       (error) => {
  //         this.notificationsSvc.push(new NotificationModel({
  //           message: `Error has occured while archiving space post!`,
  //           type: 'danger'
  //         }));
  //         // Utils.scrollTop();
  //       }
  //     );
  // }


}
