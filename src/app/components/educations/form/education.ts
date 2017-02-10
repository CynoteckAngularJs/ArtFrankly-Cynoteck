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
import {EducationModel, IEducation} from '../models';
import {EducationsService} from '../services/educations-service';
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
  selector: 'education-form',
  directives: [...ROUTER_DIRECTIVES, NgClass, ...FORM_DIRECTIVES],
  providers: [EducationsService],
  pipes: [JsonPipe],
  styles: [ require('./education.css') ],
  template: require('./education.html')
})
@CanActivate(checkIfHasPermission)
export class EducationForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() item: EducationModel;
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
      private educationsService: EducationsService,
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
    let education: IEducation = this.item;
    this.form = this.builder.group({
      '@id': [education && education['@id'] || ''],
      location: [education && education.location || ''],
      school: [education && education.school || '', Validators.required],
      degree: [education && education.degree || ''],
      areaOfFocus: [education && education.areaOfFocus || ''],
      startDate: [
        moment(education && education.startDate).isValid() ?
          Utils.format(education && education.startDate, DATE_FORMAT) : '',
        Validators.compose([UrlValidators.date])
      ],
      endDate: [
        moment(education && education.endDate).isValid() ?
          Utils.format(education && education.endDate, DATE_FORMAT) : '',
        Validators.compose([UrlValidators.date])
      ],
      // Profile is set to already stored profile or passed in profile's @id
      profile: [
        education && education.profile || (this.profile && this.profile['@id']) || '',
        Validators.required
      ],
      present: [education && education.present || false]
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
      (<Control> this.form.controls['location'])
        .updateValue(education['location'], this.controlUpdateOptions);
      (<Control> this.form.controls['school'])
        .updateValue(education['school'], this.controlUpdateOptions);
      (<Control> this.form.controls['degree'])
        .updateValue(education['degree'], this.controlUpdateOptions);
      (<Control> this.form.controls['areaOfFocus'])
        .updateValue(education['areaOfFocus'], this.controlUpdateOptions);
      (<Control> this.form.controls['startDate'])
        .updateValue(
          moment(education['startDate']).isValid() ?
            Utils.format(education['startDate'], DATE_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['endDate'])
        .updateValue(
          moment(education['endDate']).isValid() ?
            Utils.format(education['endDate'], DATE_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['profile'])
        .updateValue(education['profile'] || profile['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['present'])
        .updateValue(education['present'] || false, this.controlUpdateOptions);
    }
  }

  onDelete(education, $event) {
    $event.preventDefault();
    this.remove.next(education);
  }

  saveOrUpdate(formValues, $event) {
    $event.preventDefault();
    if ((formValues.startDate || '').trim().length) {
      formValues.startDate = moment(formValues.startDate).toDate();
    } else {
      formValues.startDate = null;
    }
    if ((formValues.endDate || '').trim().length) {
      formValues.endDate = moment(formValues.endDate).toDate();
    } else {
      formValues.endDate = null;
    }
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
