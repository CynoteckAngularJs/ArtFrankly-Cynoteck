import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  ViewChild
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
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {UrlValidators} from '../../../url/validators/validators';
import {AFUploader} from '../../af-uploader/af-uploader';
import {UPLOADER} from '../../../constants';
import {
  ArrayUtils,
  IWrappedMedia,
  WrappedMediaModel
} from '../../../url/utils/index';
import {ArtworkModel} from '../models';
import {ArtworkForms} from '../../artworks/list/artworks';

export const MODES = {
  view: 'view',
  edit: 'edit'
};

@Component({
  selector: 'photo-and-video-form',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    ...FORM_DIRECTIVES,
    AFUploader,
    ArtworkForms
  ],
  providers: [],
  pipes: [JsonPipe],
  styles: [ require('./photoandvideo.css') ],
  template: require('./photoandvideo.html')
})
@CanActivate(checkIfHasPermission)
export class PhotoAndVideoForm implements OnInit, OnChanges, OnDestroy {
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() item: WrappedMediaModel;
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  @Input() mode: string = MODES.view;
  @Input() opened: boolean = false;
  @Input() artwork: ArtworkModel;
  MODES: any = MODES;
  UPLOADER: any = UPLOADER;
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  profileDisposable: Subscription<any>;
  isShowErrors: boolean = false;
  @ViewChild(AFUploader) afUploader;

  constructor() {}

  ngOnInit() {
    console.log(this.item);
  }

  ngOnChanges(changes) {}

  ngOnDestroy() {}

  onDelete(wrappedMedia, $event) {
    $event.preventDefault();
    // For non saved items confirm deletion and notify parent (perform clenaup)
    if (this.item.isNew()) {
      if (confirm('Are you sure you want to delete this file?')) {
        this.removed.next(this.item);
      }
    } else {
      // For already uploaded items trigger removal from afUplaoder cmp
      this.afUploader.removeMedia($event);
    }
  }

  onProfilePhotoUploaded($event) {
    // Need to update the item (so that onDelete works OK -> this.item.isNew())
    this.item.update($event.toWrappedMedia());
    this.saved.next($event);
  }

  onProfilePhotoRemoved(mediaId: string) {
    // remove the View (by notiying list component)
    this.removed.next(this.item);
  }

  onAddArtwork($event) {
    $event.preventDefault();
    this.artwork = new ArtworkModel();
  }

  setMode(mode: string, $event) {
    $event.preventDefault();
    this._setMode(mode);
    this.modechanged.next(mode);
  }

  private _setMode(mode: string) {
    this.mode = mode;
    return mode;
  }
}
