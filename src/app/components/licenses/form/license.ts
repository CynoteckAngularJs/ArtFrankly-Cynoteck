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
import {LicenseModel, ILicense} from '../models';
import {LicensesService} from '../services/licenses-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {Utils} from '../../../url/utils/index';
import {DATE_FORMAT, DATE_TIME_FORMAT} from '../../../config';
import {UrlValidators} from '../../../url/validators/validators';

declare var moment: any;

export const MODES = {
  view: 'view',
  edit: 'edit'
};

@Component({
  selector: 'license-form',
  directives: [...ROUTER_DIRECTIVES, NgClass, ...FORM_DIRECTIVES],
  providers: [LicensesService],
  pipes: [JsonPipe],
  styles: [ require('./license.css') ],
  template: require('./license.html')
})
@CanActivate(checkIfHasPermission)
export class LicenseForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() item: LicenseModel;
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  @Input() mode: string = MODES.view;
  MODES: any = MODES;
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  profileDisposable: Subscription<any>;
  isShowErrors: boolean = false;

  constructor(
      private builder: FormBuilder,
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      private licensesService: LicensesService,
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

  // getLicense(filter?: any) {
  //   this.itemsService.get(filter)
  //     .subscribe(
  //       (response) => this.item = response
  //     );
  // }

  initForm() {
    let license: ILicense = this.item;
    this.form = this.builder.group({
      '@id': [license && license['@id'] || ''],
      title: [license && license.title || '', Validators.required],
      organization: [license && license.organization || '', Validators.required],
      licenseNr: [license && license.licenseNr || '', Validators.required],
      certificationUrl: [license && license.certificationUrl || '', UrlValidators.url],
      validStartDate: [
        moment(license && license.validStartDate).isValid() ?
          Utils.format(license && license.validStartDate, DATE_FORMAT) : '',
        UrlValidators.date
      ],
      endDate: [
        moment(license && license.endDate).isValid() ?
          Utils.format(license && license.endDate, DATE_FORMAT) : '',
        UrlValidators.date
      ],
      doesntExpire: [license && license.doesntExpire || false],
      // Profile is set to already stored profile or passed in profile's @id
      profile: [
        license && license.profile || (this.profile && this.profile['@id']) || '',
        Validators.required
      ]
		});
    // this.form.valueChanges.subscribe((value) => {
    //   console.log('BASE CMP valueChanges ', value);
    // });
  }

  updateFormValues() {
    let license = this.item;
    let profile = this.profile;
    if (this.form) {
      (<Control> this.form.controls['@id'])
        .updateValue(license['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['title'])
        .updateValue(license['title'], this.controlUpdateOptions);
      (<Control> this.form.controls['organization'])
        .updateValue(license['organization'], this.controlUpdateOptions);
      (<Control> this.form.controls['licenseNr'])
        .updateValue(license['licenseNr'], this.controlUpdateOptions);
      (<Control> this.form.controls['certificationUrl'])
        .updateValue(license['certificationUrl'] || '', this.controlUpdateOptions);
      (<Control> this.form.controls['validStartDate'])
        .updateValue(
          moment(license['validStartDate']).isValid() ?
            Utils.format(license['validStartDate'], DATE_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['endDate'])
        .updateValue(
          moment(license['endDate']).isValid() ?
            Utils.format(license['endDate'], DATE_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['doesntExpire'])
        .updateValue(license['doesntExpire'] || false, this.controlUpdateOptions);
      (<Control> this.form.controls['profile'])
        .updateValue(license['profile'] || profile['@id'], this.controlUpdateOptions);
    }
  }

  onDelete(license, $event) {
    $event.preventDefault();
    this.remove.next(license);
  }

  saveOrUpdate(formValues: ILicense, $event) {
    $event.preventDefault();
    this.isShowErrors = !this.form.valid;
    if (this.form.valid) {
      this.item.merge(formValues);
      this.save.next(this.item);
    }
  }

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
