import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  Inject,
  ViewChildren,
  QueryList,
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
import {EducationModel, IEducation, DEFAULT_EDUCATION} from '../models';
import {EducationsService, ProfileEducationsList} from '../services/educations-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {ArrayUtils} from '../../../url/utils/index';
import {EducationForm} from '../form/education';
import {
  FormatDatePipe,
  FormatAddressPipe,
  CommaPipe,
  SmarTextPipe,
  ReversePipe,
  SortByDatePipe
} from '../../../url/pipes/pipes';
// import {IFormListItem, IFormList} from '../models';

/**
 * <education-forms [items]="educationsFormList.items"
 *       [profile]="profile"
 *       (add)="educationsFormList.onItemAdd($event)">
 *     <education-form *ngFor="#education of educationsFormList.items"
 *               [item]="education"
 *               (removed)="educationsFormList.onItemRemoved($event)"
 *               (saved)="educationsFormList.onItemSaved($event)"
 *               (selected)="educationsFormList.onItemSelected($event)">
 *     </education-form>
 *   </education-forms>
 */
@Component({
  selector: 'education-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    EducationForm
  ],
  providers: [],
  pipes: [JsonPipe, SortByDatePipe],
  // styles: [ require('./educations.css') ],
  template: require('./educations.html')
})
@CanActivate(checkIfHasPermission)
export class EducationForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: EducationModel[] = [];
  unsavedItems: EducationModel[] = [];
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  profileDisposable: Subscription<any>;
  educationsDisposable: Subscription<any>;
  educationsQueryDisposable: Subscription<any>;
  @ViewChildren(EducationForm)
  educationForms: QueryList<EducationForm>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private educationsService: EducationsService
  ) {
    // this.profileDisposable = this.appSrv.$stream
    //   .filter((state) => state.action === ACTIONS.PROFILE_SELECTED)
    //   .map((state) => state.selectedProfile)
    //   .subscribe((profile) => this.profile = profile);

    // Make sure empty form is there if no events 
    // this.ensureNInstaces();
  }

  ngOnInit() {
    this.query();
  }

  ngOnChanges(changes) {
    console.log('ngOnChange ', changes);
    let profile = changes.profile;
    let isProfileSet = profile && !profile.previousValue['@id'] && profile.currentValue['@id'];
    if (isProfileSet) {
      this.educationsStreamSubscription();
    }
  }

  query() {
    if (this.profile['@id']) {
      this.educationsQueryDisposable = this.educationsService
        .query({ profile: this.profile['@id'] })
        // required to subscribe to evaluate Observable 
        .subscribe(
          (educations: EducationModel[]) => {
            if (!educations['hydra:member'].length) {
              // Make sure empty form is there if no events 
              this.ensureNInstaces();
            }
          },
          (error) => console.log('Error retrieving educations ', error)
        );
    }
  }

  ngOnDestroy() {
    if (this.educationsQueryDisposable) {
      this.educationsQueryDisposable.unsubscribe();
    }
    if (this.educationsDisposable) {
      this.educationsDisposable.unsubscribe();
    }
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(education: EducationModel) {
    console.log('onRemoveItem ', education, education.isNew());
    let deleteSuccess = (response) => {
      this.notificationsSvc.push(new NotificationModel({
        message: `Education has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles education!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the educaiton?')) {
      if (education.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, education);
      } else {  // removing saved item
        // API call to remove the item
        this.educationsService.delete(education).subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.addModel({ profile: this.profile['@id'] });
    this.add.next(this.profile);
  }

  onSaveItem(education: EducationModel) {
    let isSave = education.isNew();
    let method = isSave ? 'save' : 'update';
    let self = this;
    this.educationsService[method](education)
      .subscribe(
        (response: EducationModel) => {
          // TODO: Add (if new) or Update (if existing) event in this.items
          this.notificationsSvc.push(new NotificationModel({
            message: `Education has been saved!`,
            type: 'success'
          }));
          // Make sure to remove the item from the unsavedItems list
          if (isSave) {
            this.unsavedItems = ArrayUtils.remove(this.unsavedItems, education);
            // this.ensureNInstaces();
          }
          this.educationForms
            .filter(this.findFormWithModel(education))
            .forEach((form) => form.setMode(form.MODES.view));
          // this.item = response;
          // TODO: fix below by 
          // changing education.mode or @ContentChildren and set its mode from here!
          // this._setMode(this.MODES.view);
          // TODO: immutable below Object.assign(new EducationModel(), response);
          this.saved.next({ education: response, method: method });
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's education!`,
            type: 'danger'
          }));
        }
      );
  }

  private findFormWithModel(education: EducationModel) {
    return (form: EducationForm)  => {
      return form.item['@id'] === education['@id'];
    };
  }

  private educationsStreamSubscription() {
    let profileId = this.profile['@id'];
    this.educationsDisposable = this.educationsService.$stream
        .map((state: ProfileEducationsList) => {
          return state.profileEducations(profileId);
        })
        .subscribe(this.onProfileEducationsChanges.bind(this));
  }

  private onProfileEducationsChanges(profileEducations: EducationModel[]) {
    console.log('onProfileEducationsChanges ', profileEducations);
    this.items = profileEducations;
    // this.ensureNInstaces();
  }

  private addModel(education?: IEducation) {
    this.unsavedItems.push(this.getModel(education));
  }

  /**
   * @Override
   */
  private getModel(education?: IEducation): EducationModel {
    let educationModel = new EducationModel(education);
    educationModel = Object.assign(new EducationModel({ cid: educationModel.cid }), educationModel);
    // educationModel.profile = this.profile['@id'];
    return educationModel;
  }

  private ensureNInstaces(nrOfInstances: number = 1) {
    if (nrOfInstances > this.unsavedItems.length) {
      for (var index = this.unsavedItems.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }
}


// TODO: to be extended by Profile and scope everything event related here
// TODO: listen to profile changes (via extend)?
export class EducationsFormList {
  // @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  items: EducationModel[] = [];

  constructor(
      @Inject(EducationsService) private itemsService?: EducationsService,
      @Inject(NotificationsCollection) private notificationsSvc?: NotificationsCollection
  ) {
    this.ensureNInstaces(1);
    // this.itemsService.$stream
      // .map((state: ProfileEducationsList) => state.findByProfile(this.profile))
      // .subscribe(this.onStateChange);
  }

  onItemSelect($event) {}

  onItemAdd(profile) {
    let evt = Object.assign({}, DEFAULT_EDUCATION, { profile: profile['@id'] });
    this.addModel(evt);
  }

  onItemSaved($event: EducationModel) {
    // Nothing to do (Form aleady exists and is handled internally)
  }

  onItemRemoved(educationModel: EducationModel) {
    // TODO: Find and Remove event from this.items (destroy the View implicitly!)
    this.items = ArrayUtils.remove(this.items, educationModel);
  }

  query(filter: any = {}) {
    let params = Object.assign({}, filter);
    this.itemsService.query(params);
      // .subscribe(
      //   (response: EducationModel) => {
      //     this.items = response['hydra:member'];
      //     this.ensureNInstaces(1);
      //   },
      //   (response: any) => {
      //     console.log('ERROR: query() ', response);
      //     this.notificationsSvc.push(new NotificationModel({
      //       message: `Error has occured while retrieving profile's events!`,
      //       type: 'danger'
      //     }));
      //   }
      // );
  }

  private addModel(education?: IEducation) {
    this.items.push(this.getModel(education));
  }

  /**
   * @Override
   */
  private getModel(education?: IEducation): EducationModel {
    let educationModel = new EducationModel(education);
    educationModel = Object.assign(new EducationModel({ cid: educationModel.cid }), educationModel);
    // educationModel.profile = this.profile['@id'];
    return educationModel;
  }

  private ensureNInstaces(nrOfInstances: number) {
    if (nrOfInstances > this.items.length) {
      for (var index = this.items.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }

  private onStateChange(state: ProfileEducationsList) {}
}
