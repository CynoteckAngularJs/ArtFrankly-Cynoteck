import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  ViewChild,
  ChangeDetectorRef
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
import {AppService, ACTIONS} from '../../../../authentication/services/app-service';
import {NotificationsCollection} from '../../../../notifications/services/notifications';
import {NotificationModel} from '../../../../notifications/notification/notification';
import {checkIfHasPermission} from '../../../../authentication/services/token-manager-service';
import {MessageModel} from '../models';
import {MessagesService} from '../services/messages-service';
import {UploadsService} from '../../../../af-uploader/services/uploads-service';
import {AFUploader} from '../../../../af-uploader/af-uploader';
import {AFUploaderLink} from '../../../../af-uploader/af-uploader-link';
import {UPLOADER} from '../../../../../constants';
import {ISpacePost, SpacePostStorage, SpacePostModel} from '../../models';
import {
  Utils,
  ArrayUtils,
  IWrappedMedia,
  WrappedMediaModel,
  IUpload,
  UploadModel,
  IMedia,
  MediaModel
} from '../../../../../url/utils/index';
import {FileSizePipe} from '../../../../../url/pipes/pipes';
import {SpacePostReplyModel} from '../../reply/models';

@Component({
  selector: 'message-form',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    ...FORM_DIRECTIVES,
    AFUploader,
    AFUploaderLink
  ],
  providers: [],
  pipes: [JsonPipe, FileSizePipe],
  styles: [ require('./message.css') ],
  template: require('./message.html')
})
@CanActivate(checkIfHasPermission)
export class MessageForm implements OnInit, OnChanges, OnDestroy {
  @Input() message: MessageModel = new MessageModel();
  @Input() spaceResponse: SpacePostReplyModel;
  @Input() spacepost: SpacePostModel;
  @Input() profile: string;
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() uploadsuccess: EventEmitter<any> = new EventEmitter();
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  isShowErrors: boolean = false;
  UPLOADER: any = UPLOADER;
  @ViewChild(AFUploaderLink) afUploaderLink;
  uploadedItems: UploadModel[] = [];
  isFocused: boolean = false;
  filesToUpload: any[] = [];
  nrOfUploadedFiles: number = 0;

  constructor(
      private builder: FormBuilder,
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public messageSrv: MessagesService,
      private notificationsSvc: NotificationsCollection,
      private uploadsSrv: UploadsService,
      private cdr: ChangeDetectorRef
  ) {
    // if (!this.message) {
    //   this.message = new MessageModel();
    // }
    this.initForm();
  }

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.message) {
      this.updateFormValues();
    }
    if (changes.spaceResponse && changes.spaceResponse.currentValue) {
      this.updateFormValues();
    }
    if (changes.profile && changes.profile.currentValue) {
      this.updateFormValues();
    }
  }

  ngOnDestroy() {}

  initForm() {
    this.form = this.builder.group({
      text: [this.message && this.message.text || this.defaultText, Validators.required],
      spaceResponse: [this.spaceResponse && this.spaceResponse['@id'] || '', Validators.required],
      profile: [this.profile || '', Validators.required]
		});
  }

  updateFormValues() {
    if (this.form) {
      (<Control> this.form.controls['text'])
        .updateValue(this.message.text || this.defaultText, this.controlUpdateOptions);
      (<Control> this.form.controls['spaceResponse'])
        .updateValue(this.spaceResponse['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['profile'])
        .updateValue(this.profile, this.controlUpdateOptions);
    }
  }

  saveOrUpdate(formValues: any, $event) {
    $event.preventDefault();
    this.isShowErrors = !this.form.valid;
    console.log('afUploaderLink ', this.afUploaderLink);
    if (this.form.valid) {
      let method = this.message.isNew() ? 'save' : 'update';
      this.messageSrv[method](formValues).subscribe(
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Message has been sent!`,
            type: 'success'
          }));
          // TODO: use update() method and remove below
          this.message['@id'] = resp['@id'];
          this.message.text = formValues.text;
          // if there are pending images upload them
          if (method === 'save' && this.afUploaderLink.ngFileSelect.uploader.getQueueSize()) {
            // Wait event cycle for afUploader cmp to pick up the objectvalue 
            setTimeout(() => this.afUploaderLink.ngFileSelect.uploader.uploadFilesInQueue());
          }
          this.saved.next(resp);
        }).bind(this),
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while sending the message!`,
            type: 'danger'
          }));
        }).bind(this)
      );
    }
  }

  onMediaUploaded(uploadedItem: UploadModel) {
    console.log('onMediaUploaded ', uploadedItem);
    this.uploadedItems.push(uploadedItem);
    this.nrOfUploadedFiles++;
    if (this.nrOfUploadedFiles === this.filesToUpload.length) {
      console.log('Uploaded all files - trigger filesuploadedsuccess event');
      this.uploadsuccess.next({ uploadedItems: [...this.uploadedItems] });
    }
  }

  onMediaRemoved($event: string) {
    console.log('onMediaRemoved (mediaId)', $event);
  }

  removeFile($event, file: UploadModel) {
    $event.preventDefault();
    let mediaId = file && file.id;
    // TODO: delete the file!
    if (mediaId) {
      if (confirm('Are you sure you want to delete this file?')) {
        // TODO: remove media
        this.uploadsSrv.delete(mediaId)
          .subscribe(
            (response) => {
              this.notificationsSvc.push(new NotificationModel({
                message: `File has been deleted!`,
                type: 'success'
              }));
              // Cleanup
              this.uploadedItems = ArrayUtils.remove(this.uploadedItems, file);
            },
            (error) => {
              this.notificationsSvc.push(new NotificationModel({
                message: `Error has occured while removing file!`,
                type: 'danger'
              }));
            }
          );
      }
    }
  }

  get isAutoUpload() {
    return !this.message.isNew();
  }

  get defaultText() {
    let profileName = this.appSrv.activeProfileName;
    /* tslint:disable */
    let defaultText = `Please reply here

Regards,
${profileName}`;
    /* tslint:enable */
    return defaultText;
  }

  toggleFocused($event) {
    this.isFocused = !this.isFocused;
  }

  onFileChange($event?: any) {
    this.updateFilesToUpload(this.afUploaderLink.ngFileSelect.uploader._queue);
  }

  updateFilesToUpload(files: any[] = []): void {
    this.filesToUpload = [...files];
  }

  onFileRemove($event, fIndex: number = 0) {
    $event.preventDefault();
    this.afUploaderLink.ngFileSelect.uploader.removeFileFromQueue(fIndex);
    this.onFileChange();
  }

  toKB(fileSize: number) {
    return Utils.toKB(fileSize);
  }

}
