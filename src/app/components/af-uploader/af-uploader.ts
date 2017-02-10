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
  ViewChild,
} from 'angular2/core';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  NgStyle,
  JsonPipe,
  AsyncPipe
} from 'angular2/common';
import { API } from '../../config';
import { NotificationsCollection } from '../notifications/services/notifications';
import { NotificationModel } from '../notifications/notification/notification';
import {
  Utils,
  IWrappedMedia,
  WrappedMediaModel,
  IUpload,
  UploadModel,
  IMedia,
  MediaModel
} from '../../url/utils/index';
import { UPLOAD_DIRECTIVES } from '../../url/components/ng2-uploader/ng2-uploader';
import {
  NgFileSelect
} from '../../url/components/ng2-uploader/src/directives/ng-file-select';
import { UploadsService } from './services/uploads-service';
import { TokenManager } from '../authentication/services/token-manager-service';

declare var jQuery: any;

/**
 * <af-uploader [object]="Profile|"
 *              [class]=""
 *              (saveerror)="onSaveError($event)"
 *              (savesuccess)="onSaveError($event)">
 * </af-uploader>
 */
@Component({
  selector: 'af-uploader',
  directives: [...UPLOAD_DIRECTIVES, NgStyle],
  pipes: [JsonPipe],
  styles: [require('./af-uploader.css')],
  template: require('./af-uploader.html')
})
export class AFUploader implements OnInit, OnChanges, AfterViewInit {
  @Input() featuredImage: string;
  @Input() isFeaturedImage: string;
  @Input() objectvalue: string;
  @Input() classvalue: string;
  @Input() fallback: string = './src/assets/img/feed-icons/Fine_Art_Picture.jpg';
  @Input() alt: string = '';
  @Input() src: string;
  // @Input() media: IWrappedMedia;
  @Input() media: IMedia;
  @Input() opened: boolean = false;
  @Input() multiple: boolean = false;
  @Input() autoUpload: boolean = true;
  @Input() deleteable: boolean = true;
  @Input() disabled: boolean = false;
  @Input() isShowProgress: boolean = true;
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() saveerror: EventEmitter<any> = new EventEmitter();
  @Output() savesuccess: EventEmitter<any> = new EventEmitter();
  @Output() removeerror: EventEmitter<any> = new EventEmitter();
  @Output() removesuccess: EventEmitter<any> = new EventEmitter();
  @ViewChild(NgFileSelect) ngFileSelect;

  private uploadFile: UploadModel = new UploadModel({});
  private uploaderOptions: any = {
    url: API.UPLOADS,
    authTokenPrefix: 'Bearer',
    authToken: undefined,
    autoUpload: true,
    data: {
      object: undefined,
      class: undefined,
    }
  };
  private zone: NgZone;
  private progress: number = 0;
  private $el: any;
  private $fileInput: any;
  // Generating src for image to be uplaoded (selected image)
  private blobSrc: string;

  constructor(
    private builder: FormBuilder,
    public notificationsSvc: NotificationsCollection,
    private uploadsSrv: UploadsService,
    private el: ElementRef,
    private tokenManager: TokenManager
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.uploaderOptions.authToken = this.tokenManager.get();
    this.initEvents();
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.$el = jQuery(this.el.nativeElement).find('.af-uploader');
    this.$fileInput = this.$el.find('input[type="file"]');
    if (this.opened && this.$fileInput.length) {
      this.$fileInput.click();
    }
  }

  ngOnChanges(changes) {
    if (changes.classvalue && changes.classvalue.currentValue) {
      this.uploaderOptions.data.class = this.classvalue;
    }
    if (changes.objectvalue && changes.objectvalue.currentValue) {
      this.uploaderOptions.data.object = this.objectvalue;
    }
    if (changes.autoUpload) {
      this.uploaderOptions.autoUpload = this.autoUpload;
    }
    if (changes.multiple) {
      this.uploaderOptions.multiple = this.multiple;
    }
  }

  initEvents(): void {
    this.el.nativeElement.addEventListener('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();

      let dt = e.dataTransfer;
      let files = dt.files;

      if (files.length) {
        this.ngFileSelect.uploader.addFilesToQueue(files);
      }
      this.$el.removeClass('is-dragover');
    }, false);

    this.el.nativeElement.addEventListener('dragenter', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.$el.addClass('is-dragover');
    }, false);

    this.el.nativeElement.addEventListener('dragover', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.$el.addClass('is-dragover');
    }, false);

    this.el.nativeElement.addEventListener('dragover', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.$el.addClass('is-dragover');
    }, false);

    this.el.nativeElement.addEventListener('dragleave', (e) => {
      this.$el.removeClass('is-dragover');
    }, false);

    this.el.nativeElement.addEventListener('dragend', (e) => {
      this.$el.removeClass('is-dragover');
    }, false);
  }

  handleUpload(data: any): void {
    let isResponseOK = data.status >= 200 && data.status < 300;
    // Cases: done, abort, error
    if (data && isResponseOK && data.response) {
      this.uploadFile = new UploadModel(JSON.parse(data.response));
      this.savesuccess.next(this.uploadFile);
    }
    this.zone.run(() => {
      this.progress = data.progress.percent;
    });
  }

  removeMedia($event) {

    $event.preventDefault();
    let media = new MediaModel(this.media);
    let mediaId = media.id || this.uploadFile.id;
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
            // Cleanup here?
            this.reset($event);
            this.removesuccess.next(mediaId);
          },
          (error) => {
            this.notificationsSvc.push(new NotificationModel({
              message: `Error has occured while removing file!`,
              type: 'danger'
            }));
            this.removeerror.next(media);
          }
          );
      }
    }
  }

  onFileChange($event) {
    if ($event && $event.target && $event.target.files[0]) {
      this.blobSrc = URL.createObjectURL($event.target.files[0]);
      this.change.next($event);
    }
  }

  unqueueMedia($event) {
    $event.preventDefault();
    if (confirm('Are you sure you want to delete this file?')) {
      this.$el.get(0).reset();
      this.ngFileSelect.uploader.clearQueue();
    }
  }

  uploadItem() { }

  uploadAll() { }

  getQueueSize() {
    return (
      this.ngFileSelect &&
      this.ngFileSelect.uploader &&
      this.ngFileSelect.uploader.getQueueSize()
    ) || 0;
  }

  uploadFilesInQueue() {
    if (this.ngFileSelect && this.ngFileSelect.uploader) {
      this.ngFileSelect.uploader.uploadFilesInQueue();
    }
  }


  setMediaToQueue(data: any[]){
     this.ngFileSelect.uploader.addFilesToQueue(data);
  }

  isVideo(fileFormat: string) {
    return Utils.isVideoFormat(fileFormat);
  }

  get isVideo() {
    return Utils.isVideoFormat(this.uploadFile && this.uploadFile.fileFormat) ||
      Utils.isVideoFormat(this.media && this.media.fileFormat) ||
      Utils.isVideoFormat(this.uploadFile && this.uploadFile.fileFormat);
  }

  get src() {
    
   return (this.media && this.media.contentUrl) ||
      (this.uploadFile && this.uploadFile.contentUrl) ||
      (!this.autoUpload && this.blobSrc) || (this.isFeaturedImage && this.featuredImage);
  }

  get isDisabled(): boolean {
    let isDisabled = this.disabled || !this.objectvalue;
    return this.disabled;
  }

  private reset(media?: any) {
    this.uploadFile = new UploadModel({});
    this.media = {};
    // this.src = '';
    // TODO: remove files
    if (!this.multiple) {
      this.progress = 0;
    }
    // Reset form values (input['file] cached selected files)
    if (this.$el.length) {
      this.$el.get(0).reset();
    }
    // this.ngFileSelect.uploader.removeFileFromQueue(index);
  }
}
