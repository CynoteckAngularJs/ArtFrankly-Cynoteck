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
import {HonorModel, IHonor, DEFAULT_HONOR} from '../models';
import {HonorsService, ProfileHonorsList} from '../services/honors-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {ArrayUtils} from '../../../url/utils/index';
import {HonorForm} from '../form/honor';
// import {IFormListItem, IFormList} from '../models';

/**
 * <honor-forms [items]="honorsFormList.items"
 *       [profile]="profile"
 *       (add)="honorsFormList.onItemAdd($event)">
 *     <honor-form *ngFor="#honor of honorsFormList.items"
 *               [item]="honor"
 *               (removed)="honorsFormList.onItemRemoved($event)"
 *               (saved)="honorsFormList.onItemSaved($event)"
 *               (selected)="honorsFormList.onItemSelected($event)">
 *     </honor-form>
 *   </honor-forms>
 */
@Component({
  selector: 'honor-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    HonorForm],
  providers: [],
  pipes: [JsonPipe],
  // styles: [ require('./honors.css') ],
  template: require('./honors.html')
})
@CanActivate(checkIfHasPermission)
export class HonorForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: HonorModel[] = [];
  unsavedItems: HonorModel[] = [];
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  profileDisposable: Subscription<any>;
  honorsDisposable: Subscription<any>;
  honorsQueryDisposable: Subscription<any>;
  @ViewChildren(HonorForm)
  honorForms: QueryList<HonorForm>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private honorsService: HonorsService
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
      this.honorsStreamSubscription();
    }
  }

  query() {
    if (this.profile['@id']) {
      this.honorsQueryDisposable = this.honorsService
        .query({ profile: this.profile['@id'] })
        // required to subscribe to evaluate Observable 
        .subscribe(
          (honors: HonorModel[]) => {
            if (!honors['hydra:member'].length) {
              // Make sure empty form is there if no events 
              this.ensureNInstaces();
            }
          },
          (error) => console.log('Error retrieving honors ', error)
        );
    }
  }

  ngOnDestroy() {
    if (this.honorsQueryDisposable) {
      this.honorsQueryDisposable.unsubscribe();
    }
    if (this.honorsDisposable) {
      this.honorsDisposable.unsubscribe();
    }
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(honor: HonorModel) {
    console.log('onRemoveItem ', honor, honor.isNew());
    let deleteSuccess = (response) => {
      this.notificationsSvc.push(new NotificationModel({
        message: `Honor has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles honor!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the honor?')) {
      if (honor.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, honor);
      } else {  // removing saved item
        // API call to remove the item
        this.honorsService.delete(honor).subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.addModel({ profile: this.profile['@id'] });
    this.add.next(this.profile);
  }

  onSaveItem(honor: HonorModel) {
    let isSave = honor.isNew();
    let method = isSave ? 'save' : 'update';
    this.honorsService[method](honor)
      .subscribe(
        (response: HonorModel) => {
          // TODO: Add (if new) or Update (if existing) event in this.items
          this.notificationsSvc.push(new NotificationModel({
            message: `Honor has been saved!`,
            type: 'success'
          }));
          // Make sure to remove the item from the unsavedItems list
          if (isSave) {
            this.unsavedItems = ArrayUtils.remove(this.unsavedItems, honor);
            // this.ensureNInstaces();
          }
          this.honorForms
            .filter(this.findFormWithModel(honor))
            .forEach((form) => form.setMode(form.MODES.view));
          // this.item = response;
          // TODO: fix below by 
          // changing honor.mode or @ContentChildren and set its mode from here!
          // this._setMode(this.MODES.view);
          // TODO: immutable below Object.assign(new HonorModel(), response);
          this.saved.next({ honor: response, method: method });
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's honor!`,
            type: 'danger'
          }));
        }
      );
  }

  private findFormWithModel(honor: HonorModel) {
    return (form: HonorForm)  => {
      return form.item['@id'] === honor['@id'];
    };
  }

  private honorsStreamSubscription() {
    let profileId = this.profile['@id'];
    this.honorsDisposable = this.honorsService.$stream
        .map((state: ProfileHonorsList) => {
          return state.profileHonors(profileId);
        })
        .subscribe(this.onProfileHonorsChanges.bind(this));
  }

  private onProfileHonorsChanges(profileHonors: HonorModel[]) {
    console.log('onProfileHonorsChanges ', profileHonors);
    this.items = profileHonors;
    // this.ensureNInstaces(1);
  }

  private addModel(honor?: IHonor) {
    this.unsavedItems.push(this.getModel(honor));
  }

  /**
   * @Override
   */
  private getModel(honor?: IHonor): HonorModel {
    let honorModel = new HonorModel(honor);
    honorModel = Object.assign(new HonorModel({ cid: honorModel.cid }), honorModel);
    // honorModel.profile = this.profile['@id'];
    return honorModel;
  }

  private ensureNInstaces(nrOfInstances: number = 1) {
    if (nrOfInstances > this.unsavedItems.length) {
      for (var index = this.unsavedItems.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }
}
