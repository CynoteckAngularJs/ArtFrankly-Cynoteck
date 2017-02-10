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

export const MODES = {
  view: 'view',
  edit: 'edit'
};

@Component({
  selector: 'description-form',
  directives: [...ROUTER_DIRECTIVES, NgClass, ...FORM_DIRECTIVES],
  providers: [ProfilesService],
  pipes: [JsonPipe],
  styles: [ require('./description.css') ],
  template: require('./description.html')
})
@CanActivate(checkIfHasPermission)
export class DescriptionForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  @Input() mode: string = MODES.view;
  MODES: any = MODES;
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  isShowErrors: boolean = false;

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
      description: [this.profile && this.profile.description || '']
		});
  }

  updateFormValues() {
    if (this.form) {
      (<Control> this.form.controls['description'])
        .updateValue(this.profile.description, this.controlUpdateOptions);
    }
  }

  onDelete(description, $event) {
    $event.preventDefault();
    if (confirm('Are you sure you want to delete the description?')) {
      this.profile.description = '';
      let profile = BaseProfile.create(this.profile);
      this.profileService.update(profile).subscribe(
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Description has been deleted!`,
            type: 'success'
          }));
          this.updateFormValues();
          this.remove.next(this.profile);
        }).bind(this),
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while deleting the description!`,
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
      this.profile.description = formValues.description;
      let profile = BaseProfile.create(this.profile);
      this.profileService.update(profile).subscribe(
        ((resp) => {
          this.notificationsSvc.push(new NotificationModel({
            message: `Description has been saved!`,
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
            message: `Error has occured while saving the description!`,
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

  private _setMode(mode: string) {
    this.mode = mode;
    return mode;
  }
}
