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
import {EventModel, IEvent} from '../models';
import {EventsService} from '../services/events-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {FormatDatePipe} from '../../../url/pipes/pipes';
import {UrlValidators} from '../../../url/validators/validators';
import {UPLOADER} from '../../../constants';
import {AFUploader} from '../../af-uploader/af-uploader';
import {UploadModel} from '../../../url/utils/index';
import {DATE_FORMAT, DATE_TIME_FORMAT} from '../../../config';
import {Utils} from '../../../url/utils/index';

declare var moment: any;

export const MODES = {
  view: 'view',
  edit: 'edit'
};

@Component({
  selector: 'event-form',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    ...FORM_DIRECTIVES,
    AFUploader
  ],
  // providers: [EventsService],
  pipes: [JsonPipe, FormatDatePipe],
  styles: [ require('./event.css') ],
  template: require('./event.html')
})
@CanActivate(checkIfHasPermission)
export class EventForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() item: EventModel;
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  @Input() mode: string = MODES.view;
  @ViewChild(AFUploader) afUploader;
  MODES: any = MODES;
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  profileDisposable: Subscription<any>;
  isShowErrors: boolean = false;
  UPLOADER: any = UPLOADER;

  constructor(
      private builder: FormBuilder,
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      private eventsService: EventsService,
      public appSrv: AppService,
      private notificationsSvc: NotificationsCollection
  ) {
    this.initForm();

    // TODO: Do we need this? I think not!
    // this.profileDisposable = this.appSrv.$stream
    //   .filter((state) => state.action === ACTIONS.PROFILE_SELECTED)
    //   .map((state) => state.selectedProfile)
    //   .subscribe((profile) => this.onProfileSelected(profile));
  }

  // onProfileSelected(profile) {
  //   let profileId = profile && profile['@id'];
  //   // TODO: But only for non saved forms/elements!?!?
  //   this.profile = profile;
  //   if (this.item) {
  //     this.item.profile = profileId;
  //   }
  //   (<Control> this.form.controls['profile'])
  //     .updateValue(profileId, this.controlUpdateOptions);
  // }

  ngOnInit() {}

  ngOnChanges(changes) {
    console.log('ngOnChange ', changes);
    if (changes.item || changes.profile) {
      this.updateFormValues();
    }
  }

  ngOnDestroy() {
    // this.profileDisposable.unsubscribe();
  }

  // getEvent(filter?: any) {
  //   this.itemsService.get(filter)
  //     .subscribe(
  //       (response) => this.item = response
  //     );
  // }

  initForm() {
    let event: IEvent = this.item;
    this.form = this.builder.group({
      '@id': [event && event['@id'] || ''],
      title: [event && event.title || ''],
      description: [event && event.description || ''],
      photo: [event && event.photo || ''],
      startDate: [
        moment(event && event.startDate).isValid() ?
          Utils.format(event && event.startDate, DATE_TIME_FORMAT) : '',
        UrlValidators.datetime
      ],
      endDate: [
        moment(event && event.endDate).isValid() ?
          Utils.format(event && event.endDate, DATE_TIME_FORMAT) : '',
        UrlValidators.datetime
      ],
      // Profile is set to already stored profile or passed in profile's @id
      profile: [
        event && event.profile || (this.profile && this.profile['@id']) || '',
        Validators.required
      ]
		});
    // this.form.valueChanges.subscribe((value) => {
    //   console.log('BASE CMP valueChanges ', value);
    // });
  }

  updateFormValues() {
    let event = this.item;
    let profile = this.profile;
    if (this.form) {
      (<Control> this.form.controls['@id'])
        .updateValue(event['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['title'])
        .updateValue(event['title'], this.controlUpdateOptions);
      (<Control> this.form.controls['description'])
        .updateValue(event['description'], this.controlUpdateOptions);
      (<Control> this.form.controls['photo'])
        .updateValue(event['photo'], this.controlUpdateOptions);
      (<Control> this.form.controls['startDate'])
        .updateValue(
          moment(event['startDate']).isValid() ?
            Utils.format(event['startDate'], DATE_TIME_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['endDate'])
        .updateValue(
          moment(event['endDate']).isValid() ?
            Utils.format(event['endDate'], DATE_TIME_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['profile'])
        .updateValue(event['profile'] || profile['@id'], this.controlUpdateOptions);
    }
  }

  onDelete(event, $event) {
    $event.preventDefault();
    this.remove.next(event);
  }

  saveOrUpdate(formValues: IEvent, $event) {
    $event.preventDefault();
    this.isShowErrors = !this.form.valid;
    if (this.form.valid) {
      this.item.merge(formValues);
      // this.save.next(this.item);
      this._saveOrUpdate(this.item);
    }
  }

  _saveOrUpdate(event: EventModel) {
    let isSave = event.isNew();
    let method = isSave ? 'save' : 'update';
    this.eventsService[method](event)
      .subscribe(
        (response: EventModel) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Event has been saved!`,
            type: 'success'
          }));
          this.item['@id'] = response['@id'];
          if (method === 'save' && this.hasFilesToUpload()) {
            this.handleUnsavedImage(method);
            // TODO: below should be after successfull upload of all!
            this.saved.next({ event: response, method: method });
          } else {
            this._setMode(this.MODES.view);
            this.saved.next({ event: response, method: method });
          }
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's event!`,
            type: 'danger'
          }));
        }
      );
  }

  hasFilesToUpload() {
    return this.afUploader.getQueueSize() > 0;
  }

  handleUnsavedImage(method: string) {
    // if there are pending images upload them
    if (method === 'save' && this.hasFilesToUpload()) {
      // Only for SAVE OPERATION!!!
      // this.SAVE_UPLOAD_IN_PROGRESS = true;
      // Wait event cycle for afUploader cmp to pick up the objectvalue 
      setTimeout(() => this.afUploader.uploadFilesInQueue());
    }
  }

  onMediaUploaded(uploadedMedia: UploadModel) {
    console.log('onMediaUploaded ', uploadedMedia);
    let imageUrl = uploadedMedia && uploadedMedia.contentUrl;
    if (imageUrl) {
      this.item.photo = imageUrl;
      (<Control> this.form.controls['photo'])
        .updateValue(imageUrl, this.controlUpdateOptions);
      this._setMode(MODES.view);
    }
    // Is all finished?
    // if (this.SAVE_UPLOAD_IN_PROGRESS && !this.hasFilesToUpload()) {
    //   this.SAVE_UPLOAD_IN_PROGRESS = false;
    //   // TODO: update photosAndVideos property W newly uploaded item
    //   this.item.photosAndVideos.push(this.item.toWrappedMedia());
    //   this.saved.next({ event: this.item, method: 'save' });
    // }
  }

  onMediaRemoved(mediaId) {
    console.log('onMediaRemoved ', mediaId);
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

  get isAutoUpload() {
    return !this.item.isNew();
  }

  get mediaObject() {
    let photosAndVideos = (this && this.item && this.item.photosAndVideos) || [];
    let mediaObject = photosAndVideos.length && photosAndVideos[0].mediaObject;
    return mediaObject;
  }
}
