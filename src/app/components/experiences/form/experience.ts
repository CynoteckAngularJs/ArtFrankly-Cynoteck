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
import {ExperienceModel, IExperience} from '../models';
import {ExperiencesService} from '../services/experiences-service';
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
  selector: 'experience-form',
  directives: [...ROUTER_DIRECTIVES, NgClass, ...FORM_DIRECTIVES],
  providers: [ExperiencesService],
  pipes: [JsonPipe],
  styles: [ require('./experience.css') ],
  template: require('./experience.html')
})
@CanActivate(checkIfHasPermission)
export class ExperienceForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() item: ExperienceModel;
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
      private experiencesService: ExperiencesService,
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

  // getExperience(filter?: any) {
  //   this.itemsService.get(filter)
  //     .subscribe(
  //       (response) => this.item = response
  //     );
  // }
// Utils.format();
  initForm() {
    let experience: IExperience = this.item;
    this.form = this.builder.group({
      '@id': [experience && experience['@id'] || ''],
      title: [experience && experience.title || '', Validators.required],
      description: [experience && experience.description || ''],
      company: [experience && experience.company || ''],
      location: [experience && experience.location || ''],
      startDate: [
        moment(experience && experience.startDate).isValid() ?
          Utils.format(experience && experience.startDate, DATE_FORMAT) : '',
        UrlValidators.date
      ],
      endDate: [
        moment(experience && experience.endDate).isValid() ?
          Utils.format(experience && experience.endDate, DATE_FORMAT) : '',
        UrlValidators.date
      ],
      // Profile is set to already stored profile or passed in profile's @id
      profile: [
        experience && experience.profile || (this.profile && this.profile['@id']) || '',
        Validators.required
      ],
      present: [experience && experience.present || false]
		});
    // this.form.valueChanges.subscribe((value) => {
    //   console.log('BASE CMP valueChanges ', value);
    // });
  }

  updateFormValues() {
    let experience = this.item;
    let profile = this.profile;
    if (this.form) {
      (<Control> this.form.controls['@id'])
        .updateValue(experience['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['title'])
        .updateValue(experience['title'], this.controlUpdateOptions);
      (<Control> this.form.controls['description'])
        .updateValue(experience['description'], this.controlUpdateOptions);
      (<Control> this.form.controls['company'])
        .updateValue(experience['company'], this.controlUpdateOptions);
      (<Control> this.form.controls['location'])
        .updateValue(experience['location'], this.controlUpdateOptions);
      (<Control> this.form.controls['startDate'])
        .updateValue(
          moment(experience['startDate']).isValid() ?
            Utils.format(experience['startDate'], DATE_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['endDate'])
        .updateValue(
          moment(experience['endDate']).isValid() ?
            Utils.format(experience['endDate'], DATE_FORMAT) : '', this.controlUpdateOptions);
      (<Control> this.form.controls['profile'])
        .updateValue(experience['profile'] || profile['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['present'])
        .updateValue(experience['present'] || false, this.controlUpdateOptions);
    }
  }

  onDelete(experience, $event) {
    $event.preventDefault();
    this.remove.next(experience);
  }

  saveOrUpdate(formValues: IExperience, $event) {
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
