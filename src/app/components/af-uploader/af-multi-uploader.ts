import {
  Component,
  Input,
  Output,
  ViewEncapsulation,
  EventEmitter,
  OnChanges,
  OnInit,
  AfterViewInit,
  ElementRef,
  NgZone,
  ViewChild
} from 'angular2/core';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  JsonPipe,
  AsyncPipe
} from 'angular2/common';
import {API} from '../../config';
import {NotificationsCollection} from '../notifications/services/notifications';
import {NotificationModel} from '../notifications/notification/notification';
import {
  Utils,
  IWrappedMedia,
  WrappedMediaModel,
  IUpload,
  UploadModel,
  IMedia,
  MediaModel
} from '../../url/utils/index';
import {UPLOAD_DIRECTIVES} from '../../url/components/ng2-uploader/ng2-uploader';
import {
  NgFileSelect
} from '../../url/components/ng2-uploader/src/directives/ng-file-select';
import {UploadsService} from './services/uploads-service';
import {TokenManager} from '../authentication/services/token-manager-service';
import {AFUploader} from './af-uploader';

declare var jQuery: any;

/**
 * <af-uploader [object]="Profile|"
 *              [class]=""
 *              (saveerror)="onSaveError($event)"
 *              (savesuccess)="onSaveError($event)">
 * </af-uploader>
 */
@Component({
  selector: 'af-multi-uploader',
  directives: [...UPLOAD_DIRECTIVES],
  pipes: [JsonPipe],
  styles: [ require('./af-uploader.css') ],
  template: require('./af-multi-uploader.html'),
  encapsulation: ViewEncapsulation.None
})
export class AFMultiUploader extends AFUploader {

  constructor(
    builder: FormBuilder,
    notificationsSvc: NotificationsCollection,
    uploadsSrv: UploadsService,
    el: ElementRef,
    tokenManager: TokenManager
  ) {
    super(builder, notificationsSvc, uploadsSrv, el, tokenManager);
  }

}
