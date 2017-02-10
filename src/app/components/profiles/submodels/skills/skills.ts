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
import {
  IProfile,
  ProfileModel,
  IProfileEdit,
  ProfileEditModel,
  IProfileEditLD,
  ProfileEditLDModel,
  IEditForm,
  BaseProfile,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel
} from '../../models/profiles';
import {Subscription} from 'rxjs/Subscription';
import {AppService, ACTIONS} from '../../../authentication/services/app-service';
import {NotificationsCollection} from '../../../notifications/services/notifications';
import {NotificationModel} from '../../../notifications/notification/notification';
import {checkIfHasPermission} from '../../../authentication/services/token-manager-service';
import {ProfilesService} from '../../services/profiles-service';
import {Ng2Select2} from '../../../../url/components/ng2select2/select2';
import {SKILLS} from '../../../../constants';
import {Utils, IOption} from '../../../../url/utils/index';

export const MODES = {
  view: 'view',
  edit: 'edit'
};

@Component({
  selector: 'skills-form',
  directives: [...ROUTER_DIRECTIVES, NgClass, Ng2Select2, ...FORM_DIRECTIVES],
  providers: [ProfilesService],
  pipes: [JsonPipe],
  styles: [ require('./skills.css') ],
  template: require('./skills.html')
})
@CanActivate(checkIfHasPermission)
export class SkillsForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  /* tslint:disable */
  @Input() profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel = BaseProfile.create();
  /* tslint:enable */
  @Input() mode: string = MODES.view;
  MODES: any = MODES;
  SKILLS: IOption[] = [...SKILLS || []];
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  isShowErrors: boolean = false;
  select2Options: any = {
    placeholder: 'Select skills',
    tags: true
  };

  constructor(
      private builder: FormBuilder,
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      private profileService: ProfilesService,
      public appSrv: AppService,
      private notificationsSvc: NotificationsCollection
  ) {
    this.initForm();
    this.setSkillsOptions();
  }

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.profile) {
      this.updateFormValues();
    }
  }

  ngOnDestroy() {}

  initForm() {
    this.form = this.builder.group({
      skills: [this.profile && this.profile.skillsArray || '', Validators.required]
		});
  }

  updateFormValues() {
    if (this.form) {
      (<Control> this.form.controls['skills'])
        .updateValue(this.profile.skillsArray, this.controlUpdateOptions);
    }
    this.setSkillsOptions();
  }

  onDelete(skills, $event) {
    $event.preventDefault();
    if (confirm('Are you sure you want to delete the skills?')) {
      this.profile.skills = '';
      let profile = BaseProfile.create(this.profile);
      this.profileService.update(profile).subscribe(
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Skills has been deleted!`,
            type: 'success'
          }));
          this.updateFormValues();
          this.remove.next(this.profile);
        }).bind(this),
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while deleting the skills!`,
            type: 'danger'
          }));
        }).bind(this)
      );
    }
  }

  saveOrUpdate(formValues: any, $event) {
    $event.preventDefault();
    this.isShowErrors = !this.form.valid;
    if (this.form.valid) {
      this.profile.skills = (formValues.skills || []).join(',');
      let profile = BaseProfile.create(this.profile);
      this.profileService.update(profile).subscribe(
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Skills has been saved!`,
            type: 'success'
          }));
          this.setMode(MODES.view);
          this.saved.next({
            current: new ProfileProfessionalModel(resp),
            previous: profile
          });
        }).bind(this),
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving the skills!`,
            type: 'danger'
          }));
        }).bind(this)
      );
    }
  }

  setMode(mode: string, $event?: any) {
    if ($event) {
      $event.preventDefault();
    }
    this._setMode(mode);
    this.modechanged.next(mode);
  }

  private setSkillsOptions(): void {
    let skills = (this.profile && this.profile.skillsArray) || [];
    skills = skills.filter((val) => val.trim().length > 0);
    this.SKILLS = Utils.getAllMergedOptions(skills, [...SKILLS || []]);
  }

  private _setMode(mode: string) {
    this.mode = mode;
    return mode;
  }
}
