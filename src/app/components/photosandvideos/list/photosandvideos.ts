import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  Inject
} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  JsonPipe
} from 'angular2/common';
import {Subscription} from 'rxjs/Subscription';
// import {PhotoAndVideoModel, IWrappedMedia, DEFAULT_PHOTO_AND_VIDEO} from '../models';
import {UploadsService} from '../../af-uploader/services/uploads-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {
  Utils,
  ArrayUtils,
  UploadModel,
  IWrappedMedia,
  WrappedMediaModel
} from '../../../url/utils/index';
import {PhotoAndVideoForm} from '../form/photoandvideo';
// import {IFormListItem, IFormList} from '../models';

/**
 * <photo-and-videos-forms [items]="licensesFormList.items"
 *       [profile]="profile"
 *       (add)="licensesFormList.onItemAdd($event)">
 * </photo-and-videos-forms>
 */
@Component({
  selector: 'photo-and-videos-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    PhotoAndVideoForm
  ],
  providers: [],
  pipes: [JsonPipe],
  // styles: [ require('./photosandvideos.css') ],
  template: require('./photosandvideos.html')
})
@CanActivate(checkIfHasPermission)
export class PhotoAndVideoForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();

  @Input() items: WrappedMediaModel[] = [];
  unsavedItems: WrappedMediaModel[] = [];
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  isAutoOpen: boolean = false;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private uploadsService: UploadsService
  ) {
    if (!(this.items || []).length) {
      // Make sure empty form is there if no events 
      this.ensureNInstaces();
    }
  }

  ngOnInit() {}

  ngOnChanges(changes) {
    if (this.items.length) {
      this.unsavedItems.pop();
    }
  }

  ngOnDestroy() {}

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(photoAndVideo: WrappedMediaModel) {
    console.log('onRemoveItem ', photoAndVideo, photoAndVideo.isNew());
    let deleteSuccess = (response) => {
      this.notificationsSvc.push(new NotificationModel({
        message: `photoAndVideo has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles photoAndVideo!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the educaiton?')) {
      if (photoAndVideo.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, photoAndVideo);
      } else {  // removing saved item
        // API call to remove the item
        this.uploadsService.delete(photoAndVideo.id).subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  // onRemovedItem(mediaId: string) {
  onRemovedItem(item: WrappedMediaModel) {
    this.items = ArrayUtils.remove(this.items, item);
    this.unsavedItems = ArrayUtils.remove(this.unsavedItems, item);
    // let isEqual = function(citem) {
    //     return Utils.extractIdFromIRI(citem.mediaObject['@id']) === item.mediaId;
    //   };
    // let index = this.items.findIndex(isEqual);
    // // Try to remove the appropraite item from both arrays (first try this.items)
    // if (index > -1) {
    //   this.items = ArrayUtils.removeByIndex(this.items, index);
    // } else {
    //   index = this.unsavedItems.findIndex(isEqual);
    //   this.unsavedItems = ArrayUtils.removeByIndex(this.unsavedItems, index);
    // }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.isAutoOpen = true;
    this.addModel();
    this.add.next(this.profile);
  }

  onUploadSuccess(media: UploadModel) {
    // this.addModel(media.toWrappedMedia());
  }

  onSaveItem(photoAndVideo: WrappedMediaModel) {
    let isSave = photoAndVideo.isNew();
    let method = isSave ? 'save' : 'update';
    this.uploadsService[method](photoAndVideo)
      .subscribe(
        (response: WrappedMediaModel) => {
          // TODO: Add (if new) or Update (if existing) event in this.items
          this.notificationsSvc.push(new NotificationModel({
            message: `Photo and Video has been saved!`,
            type: 'success'
          }));
          // Make sure to remove the item from the unsavedItems list
          if (isSave) {
            this.unsavedItems = ArrayUtils.remove(this.unsavedItems, photoAndVideo);
            // this.ensureNInstaces();
          }
          // this.item = response;
          // TODO: fix below by 
          // changing photoAndVideo.mode or @ContentChildren and set its mode from here!
          // this._setMode(this.MODES.view);
          // TODO: immutable below Object.assign(new WrappedMediaModel(), response);
          this.saved.next({ photoAndVideo: response, method: method });
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's photo and video!`,
            type: 'danger'
          }));
        }
      );
  }

  private addModel(photoAndVideo?: IWrappedMedia) {
    this.unsavedItems.push(this.getModel(photoAndVideo));
  }

  /**
   * @Override
   */
  private getModel(photoAndVideo: IWrappedMedia = {}): WrappedMediaModel {
    let photoAndVideoModel = new WrappedMediaModel(photoAndVideo);
    photoAndVideoModel = Object.assign(
      new WrappedMediaModel({ cid: photoAndVideoModel.cid }),
      photoAndVideoModel
    );
    // photoAndVideoModel.profile = this.profile['@id'];
    return photoAndVideoModel;
  }

  private ensureNInstaces(nrOfInstances: number = 1) {
    if (nrOfInstances > this.unsavedItems.length) {
      for (var index = this.unsavedItems.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }
}
