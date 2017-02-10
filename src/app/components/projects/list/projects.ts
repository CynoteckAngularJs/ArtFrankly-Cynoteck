import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  Inject
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
import {ProjectModel, IProject, DEFAULT_PROJECT} from '../models';
import {ProjectsService, ProfileProjectsList} from '../services/projects-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {ArrayUtils} from '../../../url/utils/index';
import {ProjectForm} from '../form/project';
// import {IFormListItem, IFormList} from '../models';

/**
 * <project-forms [items]="projectsFormList.items"
 *       [profile]="profile"
 *       (add)="projectsFormList.onItemAdd($event)">
 *     <project-form *ngFor="#project of projectsFormList.items"
 *               [item]="project"
 *               (removed)="projectsFormList.onItemRemoved($event)"
 *               (saved)="projectsFormList.onItemSaved($event)"
 *               (selected)="projectsFormList.onItemSelected($event)">
 *     </project-form>
 *   </project-forms>
 */
@Component({
  selector: 'project-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    ProjectForm],
  providers: [],
  pipes: [JsonPipe],
  // styles: [ require('./projects.css') ],
  template: require('./projects.html')
})
@CanActivate(checkIfHasPermission)
export class ProjectForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: ProjectModel[] = [];
  unsavedItems: ProjectModel[] = [];
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  profileDisposable: Subscription<any>;
  projectsDisposable: Subscription<any>;
  projectsQueryDisposable: Subscription<any>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private projectsService: ProjectsService
  ) {
    // this.profileDisposable = this.appSrv.$stream
    //   .filter((state) => state.action === ACTIONS.PROFILE_SELECTED)
    //   .map((state) => state.selectedProfile)
    //   .subscribe((profile) => this.profile = profile);

    // Make sure empty form is there if no events 
    this.ensureNInstaces();
  }

  ngOnInit() {
    this.query();
  }

  ngOnChanges(changes) {
    console.log('ngOnChange ', changes);
    let profile = changes.profile;
    let isProfileSet = profile && !profile.previousValue['@id'] && profile.currentValue['@id'];
    if (isProfileSet) {
      this.projectsStreamSubscription();
    }
  }

  query() {
    if (this.profile['@id']) {
      this.projectsQueryDisposable = this.projectsService
        .query({ profile: this.profile['@id'] })
        // required to subscribe to evaluate Observable 
        .subscribe(
          (projects: ProjectModel[]) => console.log('projects retrived ', projects),
          (error) => console.log('Error retrieving projects ', error)
        );
    }
  }

  ngOnDestroy() {
    if (this.projectsQueryDisposable) {
      this.projectsQueryDisposable.unsubscribe();
    }
    if (this.projectsDisposable) {
      this.projectsDisposable.unsubscribe();
    }
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(project: ProjectModel) {
    console.log('onRemoveItem ', project, project.isNew());
    let deleteSuccess = (response) => {
      this.notificationsSvc.push(new NotificationModel({
        message: `project has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles project!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the educaiton?')) {
      if (project.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, project);
      } else {  // removing saved item
        // API caProjectto remove the item
        this.projectsService.delete(project).subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.addModel({ profile: this.profile['@id'] });
    this.add.next(this.profile);
  }

  onSaveItem(project: ProjectModel) {
    let isSave = project.isNew();
    let method = isSave ? 'save' : 'update';
    this.projectsService[method](project)
      .subscribe(
        (response: ProjectModel) => {
          // TODO: Add (if new) or Update (if existing) event in this.items
          this.notificationsSvc.push(new NotificationModel({
            message: `Project has been saved!`,
            type: 'success'
          }));
          // Make sure to remove the item from the unsavedItems list
          if (isSave) {
            this.unsavedItems = ArrayUtils.remove(this.unsavedItems, project);
            this.ensureNInstaces();
          }
          // this.item = response;
          // TODO: fix below by 
          // changing project.mode or @ContentChildren and set its mode from here!
          // this._setMode(this.MODES.view);
          // TODO: immutable below Object.assign(new ProjectModel(), response);
          this.saved.next({ project: response, method: method });
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's project!`,
            type: 'danger'
          }));
        }
      );
  }

  private projectsStreamSubscription() {
    let profileId = this.profile['@id'];
    this.projectsDisposable = this.projectsService.$stream
        .map((state: ProfileProjectsList) => {
          return state.profileProjects(profileId);
        })
        .subscribe(this.onProfileProjectsChanges.bind(this));
  }

  private onProfileProjectsChanges(profileProjects: ProjectModel[]) {
    console.log('onProfileProjectsChanges ', profileProjects);
    this.items = profileProjects;
    this.ensureNInstaces(1);
  }

  private addModel(project?: IProject) {
    this.unsavedItems.push(this.getModel(project));
  }

  /**
   * @Override
   */
  private getModel(project?: IProject): ProjectModel {
    let projectModel = new ProjectModel(project);
    projectModel = Object.assign(new ProjectModel({ cid: projectModel.cid }), projectModel);
    // projectModel.profile = this.profile['@id'];
    return projectModel;
  }

  private ensureNInstaces(nrOfInstances: number = 1) {
    if (nrOfInstances > this.unsavedItems.length) {
      for (var index = this.unsavedItems.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }
}
