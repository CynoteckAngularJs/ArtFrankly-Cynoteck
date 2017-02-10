import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges
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
import {ArtworkModel, IArtwork} from '../models';
import {ArtworksService} from '../services/artworks-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {
  IProfileEditLD,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel
} from '../../profiles/models/profiles';
import {AFUploader} from '../../af-uploader/af-uploader';
import {UPLOADER} from '../../../constants';
import {Utils} from '../../../url/utils/index';
import {DATE_FORMAT, DATE_TIME_FORMAT} from '../../../config';
import {UrlValidators} from '../../../url/validators/validators';

declare var moment: any;

export const MODES = {
  view: 'view',
  edit: 'edit'
};

@Component({
  selector: 'artwork-form',
  directives: [...ROUTER_DIRECTIVES, NgClass, ...FORM_DIRECTIVES, AFUploader],
  providers: [ArtworksService],
  pipes: [JsonPipe],
  styles: [ require('./artwork.css') ],
  template: require('./artwork.html')
})
@CanActivate(checkIfHasPermission)
export class ArtworkForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() item: ArtworkModel;
  /* tslint:disable */
  @Input() profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel = new ProfileProfessionalModel();
  /* tslint:enable */
  @Input() mode: string = MODES.view;
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
      private artworksService: ArtworksService,
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
      this.mode = this.item && this.item.mode ? this.item && this.item.mode : this.mode;
    }
  }

  ngOnDestroy() {
    // this.profileDisposable.unsubscribe();
  }

  // getArtwork(filter?: any) {
  //   this.itemsService.get(filter)
  //     .subscribe(
  //       (response) => this.item = response
  //     );
  // }

  initForm() {
    let artwork: IArtwork = this.item;
    this.form = this.builder.group({
      '@id': [artwork && artwork['@id'] || ''],
      author: [artwork && artwork.author || ''],
      headline: [artwork && artwork.headline || ''],
      medium: [artwork && artwork.medium || ''],
      size: [artwork && artwork.size || ''],
      datePublished: [
        moment(artwork && artwork.datePublished).isValid() ?
          Utils.format(artwork && artwork.datePublished, DATE_FORMAT) : '',
        UrlValidators.date
      ],
      text: [artwork && artwork.text || ''],
      mediaObject: [artwork && artwork.mediaObject || '', Validators.required],
      // Profile is set to already stored profile or passed in profile's @id
      profile: [
        artwork && artwork.profile || (this.profile && this.profile['@id']) || '',
        Validators.required
      ]
		});
  }

  updateFormValues() {
    let artwork = this.item;
    let profile = this.profile;
    if (this.form) {
      (<Control> this.form.controls['@id'])
        .updateValue(artwork['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['author'])
        .updateValue(artwork['author'], this.controlUpdateOptions);
      (<Control> this.form.controls['headline'])
        .updateValue(artwork['headline'], this.controlUpdateOptions);
      (<Control> this.form.controls['medium'])
        .updateValue(artwork['medium'], this.controlUpdateOptions);
      (<Control> this.form.controls['size'])
        .updateValue(artwork['size'], this.controlUpdateOptions);
      (<Control> this.form.controls['datePublished'])
        .updateValue(
          moment(artwork['datePublished']).isValid() ?
            Utils.format(artwork['datePublished'], DATE_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['text'])
        .updateValue(artwork['text'], this.controlUpdateOptions);
      (<Control> this.form.controls['mediaObject'])
        .updateValue(artwork['mediaObject'], this.controlUpdateOptions);
      (<Control> this.form.controls['profile'])
        .updateValue(artwork['profile'] || profile['@id'], this.controlUpdateOptions);
    }
  }

  onDelete(artwork, $event) {
    $event.preventDefault();
    this.remove.next(artwork);
  }

  saveOrUpdate(formValues: IArtwork, $event) {
    $event.preventDefault();
    this.isShowErrors = !this.form.valid;
    if (this.form.valid) {
      this.item.merge(formValues);
      this.save.next(this.item);
    }
  }

  onMediaUploaded($event) {
    // Need to update the item (so that onDelete works OK -> this.item.isNew())
    this.item.update($event.toWrappedMedia());
    this.item.mode = MODES.edit;
    this._setMode(MODES.edit);
    this.saved.next(this.item);
  }

  onMediaRemoved(mediaId: string) {
    // remove the View (by notiying list component)
    this.removed.next(this.item);
  }

  // get mediaObject() {
  //   return this.item.mediaObject || ;
  // }

  setMode(mode: string, $event?: any) {
    if ($event) {
      $event.preventDefault();
    }
    this._setMode(mode);
    this.modechanged.next(mode);
  }

  private _setMode(mode: string) {
    this.mode = mode;
    return mode;
  }
}
