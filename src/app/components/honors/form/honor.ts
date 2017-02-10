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
import {HonorModel, IHonor} from '../models';
import {HonorsService} from '../services/honors-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {UrlValidators} from '../../../url/validators/validators';
import {Utils} from '../../../url/utils/index';
import {DATE_FORMAT, DATE_TIME_FORMAT} from '../../../config';

declare var moment: any;

export const MODES = {
  view: 'view',
  edit: 'edit'
};

@Component({
  selector: 'honor-form',
  directives: [...ROUTER_DIRECTIVES, NgClass, ...FORM_DIRECTIVES],
  providers: [HonorsService],
  pipes: [JsonPipe],
  styles: [ require('./honor.css') ],
  template: require('./honor.html')
})
@CanActivate(checkIfHasPermission)
export class HonorForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() item: HonorModel;
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
      private honorsService: HonorsService,
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

  // getEducation(filter?: any) {
  //   this.itemsService.get(filter)
  //     .subscribe(
  //       (response) => this.item = response
  //     );
  // }

  initForm() {
    let honor: IHonor = this.item;
    this.form = this.builder.group({
      '@id': [honor && honor['@id'] || ''],
      receiveDate: [
        moment(honor && honor.receiveDate).isValid() ?
          Utils.format(honor && honor.receiveDate, DATE_FORMAT) : '',
        UrlValidators.date
      ],
      description: [honor && honor.description || ''],
      title: [honor && honor.title || '', Validators.required],
      organization: [honor && honor.organization || '', Validators.required],
      url: [
        honor && honor.url || '',
        UrlValidators.url
      ],
      // Profile is set to already stored profile or passed in profile's @id
      profile: [
        honor && honor.profile || (this.profile && this.profile['@id']) || '',
        Validators.required
      ]
		});
    // this.form.valueChanges.subscribe((value) => {
    //   console.log('BASE CMP valueChanges ', value);
    // });
  }

  updateFormValues() {
    let education = this.item;
    let profile = this.profile;
    if (this.form) {
      (<Control> this.form.controls['@id'])
        .updateValue(education['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['receiveDate'])
        .updateValue(
          moment(education['receiveDate']).isValid() ?
            Utils.format(education['receiveDate'], DATE_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['description'])
        .updateValue(education['description'], this.controlUpdateOptions);
      (<Control> this.form.controls['title'])
        .updateValue(education['title'], this.controlUpdateOptions);
      (<Control> this.form.controls['organization'])
        .updateValue(education['organization'], this.controlUpdateOptions);
      (<Control> this.form.controls['url'])
        .updateValue(education['url'] || '', this.controlUpdateOptions);
      (<Control> this.form.controls['profile'])
        .updateValue(education['profile'] || profile['@id'], this.controlUpdateOptions);
    }
  }

  onDelete(education, $event) {
    $event.preventDefault();
    this.remove.next(education);
  }

  saveOrUpdate(formValues: IHonor, $event) {
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
