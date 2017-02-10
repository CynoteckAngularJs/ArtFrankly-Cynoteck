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
import { ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate } from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  JsonPipe
} from 'angular2/common';
import { Subscription } from 'rxjs/Subscription';
import { AppService, ACTIONS } from '../../../../authentication/services/app-service';
import { NotificationsCollection } from '../../../../notifications/services/notifications';
import { NotificationModel } from '../../../../notifications/notification/notification';
import { checkIfHasPermission } from '../../../../authentication/services/token-manager-service';
import { JobPostReplyModel } from '../models';
import { JobPostReplyService } from '../services/jobpostreply-service';
import { AFUploader } from '../../../../af-uploader/af-uploader';
import { UploadsService } from '../../../../af-uploader/services/uploads-service';
import { AFUploaderLink } from '../../../../af-uploader/af-uploader-link';
import { UPLOADER } from '../../../../../constants';
import { IJobPost, JobPostStorage, JobPostModel } from '../../models';
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
import { FileSizePipe } from '../../../../../url/pipes/pipes';

@Component({
  selector: 'jobpost-reply-form',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    ...FORM_DIRECTIVES,
    AFUploader,
    AFUploaderLink
  ],
  providers: [JobPostReplyService],
  pipes: [JsonPipe, FileSizePipe],
  styles: [require('./reply.css')],
  template: require('./reply.html')
})
@CanActivate(checkIfHasPermission)
export class JobPostReplyForm implements OnInit, OnChanges, OnDestroy {
  @Input() reply: JobPostReplyModel;
  @Input() jobpost: JobPostModel;
  @Input() profile: string;
  @Output() saved: EventEmitter<any> = new EventEmitter();
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
    public jobpostReplySrv: JobPostReplyService,
    private notificationsSvc: NotificationsCollection,
    private uploadsSrv: UploadsService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit() { }

  ngOnChanges(changes) {
    if (changes.reply) {
      this.updateFormValues();
    }
    if (changes.jobpost && changes.jobpost.currentValue) {
      this.updateFormValues();
    }
    if (changes.profile && changes.profile.currentValue) {
      this.updateFormValues();
    }
  }

  ngOnDestroy() { }

  initForm() {
    this.form = this.builder.group({
      text: [this.reply && this.reply.text || this.defaultText, Validators.required],
      jobPosting: [this.jobpost && this.jobpost['@id'] || '', Validators.required],
      profile: [this.profile || '', Validators.required]
    });
  }

  updateFormValues() {
    if (this.form) {
      (<Control>this.form.controls['text'])
        .updateValue(this.reply.text || this.defaultText, this.controlUpdateOptions);
      (<Control>this.form.controls['jobPosting'])
        .updateValue(this.jobpost['@id'], this.controlUpdateOptions);
      (<Control>this.form.controls['profile'])
        .updateValue(this.profile, this.controlUpdateOptions);
    }
  }

  saveOrUpdate(formValues: any, $event) {
    $event.preventDefault();
    this.isShowErrors = !this.form.valid;
    console.log('afUploaderLink ', this.afUploaderLink);
    if (this.form.valid) {
      let method = this.reply.isNew() ? 'save' : 'update';
      this.jobpostReplySrv[method](formValues).subscribe(
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Reply has been sent!`,
            type: 'success'
          }));
          // TODO: use update() method and remove below
          this.reply['@id'] = resp['@id'];
          this.reply.text = formValues.text;
          // if there are pending images upload them
          if (method === 'save' && this.afUploaderLink.ngFileSelect.uploader.getQueueSize()) {
            // Wait event cycle for afUploader cmp to pick up the objectvalue 
            setTimeout(() => this.afUploaderLink.ngFileSelect.uploader.uploadFilesInQueue());
          }
          this.saved.next(resp);
        }).bind(this),
        ((resp) => {
          let msg = ''
          if (resp._body.indexOf('Integrity constraint violation') > -1)
            msg = 'You have already applied for this Job!';
          this.notificationsSvc.push(new NotificationModel({
            message: msg == '' ? `Error has occured while sending the reply!` : msg,
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
    return !this.reply.isNew();
  }

  get defaultText() {
    let profileName = this.appSrv.activeProfileName;
    /* tslint:disable */
    let defaultText = `Hello,

Lorem ipsum dolet sum eta beta alpha gama ipsum dolet sum eta beta alpha gama, ipsum dolet sum eta beta alpha gama.

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
  // get filesToUpload() {
  //   let files = this.afUploaderLink &&
  //     this.afUploaderLink.ngFileSelect &&
  //     this.afUploaderLink.ngFileSelect.uploader &&
  //     this.afUploaderLink.ngFileSelect.uploader._queue;
  //   this.cdr.detectChanges();
  //   return files || [];
  // }
}
