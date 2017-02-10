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
import {ProjectModel, IProject} from '../models';
import {ProjectsService} from '../services/projects-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';

export const MODES = {
  view: 'view',
  edit: 'edit'
};

@Component({
  selector: 'project-form',
  directives: [...ROUTER_DIRECTIVES, NgClass, ...FORM_DIRECTIVES],
  providers: [ProjectsService],
  pipes: [JsonPipe],
  styles: [ require('./project.css') ],
  template: require('./project.html')
})
@CanActivate(checkIfHasPermission)
export class ProjectForm implements OnInit, OnChanges, OnDestroy {
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() modechanged: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() removed: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() save: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() item: ProjectModel;
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
      private projectsService: ProjectsService,
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

  // getProject(filter?: any) {
  //   this.itemsService.get(filter)
  //     .subscribe(
  //       (response) => this.item = response
  //     );
  // }

  initForm() {
    let project: IProject = this.item;
    this.form = this.builder.group({
      '@id': [project && project['@id'] || ''],
      name: [project && project.name || ''],
      description: [project && project.description || '', Validators.required],
      company: [project && project.company || '', Validators.required],
      position: [project && project.position || '', Validators.required],
      startDate: [project && project.startDate || '', Validators.required],
      endDate: [project && project.endDate || '', Validators.required],
      // Profile is set to already stored profile or passed in profile's @id
      profile: [
        project && project.profile || (this.profile && this.profile['@id']) || '',
        Validators.required
      ]
		});
    // this.form.valueChanges.subscribe((value) => {
    //   console.log('BASE CMP valueChanges ', value);
    // });
  }

  updateFormValues() {
    let project = this.item;
    let profile = this.profile;
    if (this.form) {
      (<Control> this.form.controls['@id'])
        .updateValue(project['@id'], this.controlUpdateOptions);
      (<Control> this.form.controls['name'])
        .updateValue(project['name'], this.controlUpdateOptions);
      (<Control> this.form.controls['description'])
        .updateValue(project['description'], this.controlUpdateOptions);
      (<Control> this.form.controls['company'])
        .updateValue(project['company'], this.controlUpdateOptions);
      (<Control> this.form.controls['position'])
        .updateValue(project['position'], this.controlUpdateOptions);
      (<Control> this.form.controls['startDate'])
        .updateValue(project['startDate'], this.controlUpdateOptions);
      (<Control> this.form.controls['endDate'])
        .updateValue(project['endDate'], this.controlUpdateOptions);
      (<Control> this.form.controls['profile'])
        .updateValue(project['profile'] || profile['@id'], this.controlUpdateOptions);
    }
  }

  onDelete(project, $event) {
    $event.preventDefault();
    this.remove.next(project);
  }

  saveOrUpdate(formValues: IProject, $event) {
    $event.preventDefault();
    this.isShowErrors = !this.form.valid;
    if (this.form.valid) {
      this.item.merge(formValues);
      this.save.next(this.item);
    }
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
}
