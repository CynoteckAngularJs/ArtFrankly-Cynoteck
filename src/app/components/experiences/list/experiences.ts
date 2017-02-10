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
import {ExperienceModel, IExperience, DEFAULT_EXPERIENCE} from '../models';
import {ExperiencesService, ProfileExperiencesList} from '../services/experiences-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {ArrayUtils} from '../../../url/utils/index';
import {ExperienceForm} from '../form/experience';
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
 * <experience-forms [items]="experiencesFormList.items"
 *       [profile]="profile"
 *       (add)="experiencesFormList.onItemAdd($event)">
 *     <experience-form *ngFor="#experience of experiencesFormList.items"
 *               [item]="experience"
 *               (removed)="experiencesFormList.onItemRemoved($event)"
 *               (saved)="experiencesFormList.onItemSaved($event)"
 *               (selected)="experiencesFormList.onItemSelected($event)">
 *     </experience-form>
 *   </experience-forms>
 */
@Component({
  selector: 'experience-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    ExperienceForm
  ],
  providers: [],
  pipes: [JsonPipe, SortByDatePipe],
  // styles: [ require('./experiences.css') ],
  template: require('./experiences.html')
})
@CanActivate(checkIfHasPermission)
export class ExperienceForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: ExperienceModel[] = [];
  unsavedItems: ExperienceModel[] = [];
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  profileDisposable: Subscription<any>;
  experiencesDisposable: Subscription<any>;
  experiencesQueryDisposable: Subscription<any>;
  @ViewChildren(ExperienceForm)
  experienceForms: QueryList<ExperienceForm>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private experiencesService: ExperiencesService
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
      this.experiencesStreamSubscription();
    }
  }

  query() {
    if (this.profile['@id']) {
      this.experiencesQueryDisposable = this.experiencesService
        .query({ profile: this.profile['@id'] })
        // required to subscribe to evaluate Observable 
        .subscribe(
          (experiences: ExperienceModel[]) => {
            if (!experiences['hydra:member'].length) {
              // Make sure empty form is there if no events 
              this.ensureNInstaces();
            }
          },
          (error) => console.log('Error retrieving experiences ', error)
        );
    }
  }

  ngOnDestroy() {
    if (this.experiencesQueryDisposable) {
      this.experiencesQueryDisposable.unsubscribe();
    }
    if (this.experiencesDisposable) {
      this.experiencesDisposable.unsubscribe();
    }
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(experience: ExperienceModel) {
    console.log('onRemoveItem ', experience, experience.isNew());
    let deleteSuccess = (response) => {
      this.notificationsSvc.push(new NotificationModel({
        message: `Experience has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles experience!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the experience?')) {
      if (experience.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, experience);
      } else {  // removing saved item
        // API call to remove the item
        this.experiencesService.delete(experience).subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.addModel({ profile: this.profile['@id'] });
    this.add.next(this.profile);
  }

  onSaveItem(experience: ExperienceModel) {
    let isSave = experience.isNew();
    let method = isSave ? 'save' : 'update';
    this.experiencesService[method](experience)
      .subscribe(
        (response: ExperienceModel) => {
          // TODO: Add (if new) or Update (if existing) event in this.items
          this.notificationsSvc.push(new NotificationModel({
            message: `Experience has been saved!`,
            type: 'success'
          }));
          // Make sure to remove the item from the unsavedItems list
          if (isSave) {
            this.unsavedItems = ArrayUtils.remove(this.unsavedItems, experience);
            // this.ensureNInstaces();
          }
          this.experienceForms
            .filter(this.findFormWithModel(experience))
            .forEach((form) => form.setMode(form.MODES.view));
          // this.item = response;
          // TODO: fix below by 
          // changing experience.mode or @ContentChildren and set its mode from here!
          // this._setMode(this.MODES.view);
          // TODO: immutable below Object.assign(new ExperienceModel(), response);
          this.saved.next({ experience: response, method: method });
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's experience!`,
            type: 'danger'
          }));
        }
      );
  }

  private findFormWithModel(experience: ExperienceModel) {
    return (form: ExperienceForm)  => {
      return form.item['@id'] === experience['@id'];
    };
  }

  private experiencesStreamSubscription() {
    let profileId = this.profile['@id'];
    this.experiencesDisposable = this.experiencesService.$stream
        .map((state: ProfileExperiencesList) => {
          return state.profileExperiences(profileId);
        })
        .subscribe(this.onProfileExperiencesChanges.bind(this));
  }

  private onProfileExperiencesChanges(profileExperiences: ExperienceModel[]) {
    console.log('onProfileExperiencesChanges ', profileExperiences);
    this.items = profileExperiences;
    // this.ensureNInstaces(1);
  }

  private addModel(experience?: IExperience) {
    this.unsavedItems.push(this.getModel(experience));
  }

  /**
   * @Override
   */
  private getModel(experience?: IExperience): ExperienceModel {
    let experienceModel = new ExperienceModel(experience);
    experienceModel = Object.assign(
      new ExperienceModel({ cid: experienceModel.cid }), experienceModel
    );
    // experienceModel.profile = this.profile['@id'];
    return experienceModel;
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
export class ExperiencesFormList {
  // @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  items: ExperienceModel[] = [];

  constructor(
      @Inject(ExperiencesService) private itemsService?: ExperiencesService,
      @Inject(NotificationsCollection) private notificationsSvc?: NotificationsCollection
  ) {
    this.ensureNInstaces(1);
    // this.itemsService.$stream
      // .map((state: ProfileExperiencesList) => state.findByProfile(this.profile))
      // .subscribe(this.onStateChange);
  }

  onItemSelect($event) {}

  onItemAdd(profile) {
    let evt = Object.assign({}, DEFAULT_EXPERIENCE, { profile: profile['@id'] });
    this.addModel(evt);
  }

  onItemSaved($event: ExperienceModel) {
    // Nothing to do (Form aleady exists and is handled internally)
  }

  onItemRemoved(experienceModel: ExperienceModel) {
    // TODO: Find and Remove event from this.items (destroy the View implicitly!)
    this.items = ArrayUtils.remove(this.items, experienceModel);
  }

  query(filter: any = {}) {
    let params = Object.assign({}, filter);
    this.itemsService.query(params);
      // .subscribe(
      //   (response: ExperienceModel) => {
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

  private addModel(experience?: IExperience) {
    this.items.push(this.getModel(experience));
  }

  /**
   * @Override
   */
  private getModel(experience?: IExperience): ExperienceModel {
    let experienceModel = new ExperienceModel(experience);
    experienceModel = Object.assign(
      new ExperienceModel({ cid: experienceModel.cid }), experienceModel
    );
    // experienceModel.profile = this.profile['@id'];
    return experienceModel;
  }

  private ensureNInstaces(nrOfInstances: number) {
    if (nrOfInstances > this.items.length) {
      for (var index = this.items.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }

  private onStateChange(state: ProfileExperiencesList) {}
}
