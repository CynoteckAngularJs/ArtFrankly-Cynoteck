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
import {LicenseModel, ILicense, DEFAULT_LICENSE} from '../models';
import {LicensesService, ProfileLicensesList} from '../services/licenses-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {ArrayUtils} from '../../../url/utils/index';
import {LicenseForm} from '../form/license';
// import {IFormListItem, IFormList} from '../models';

/**
 * <license-forms [items]="licensesFormList.items"
 *       [profile]="profile"
 *       (add)="licensesFormList.onItemAdd($event)">
 *     <license-form *ngFor="#license of licensesFormList.items"
 *               [item]="license"
 *               (removed)="licensesFormList.onItemRemoved($event)"
 *               (saved)="licensesFormList.onItemSaved($event)"
 *               (selected)="licensesFormList.onItemSelected($event)">
 *     </license-form>
 *   </license-forms>
 */
@Component({
  selector: 'license-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    LicenseForm],
  providers: [],
  pipes: [JsonPipe],
  // styles: [ require('./licenses.css') ],
  template: require('./licenses.html')
})
@CanActivate(checkIfHasPermission)
export class LicenseForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: LicenseModel[] = [];
  unsavedItems: LicenseModel[] = [];
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  profileDisposable: Subscription<any>;
  licensesDisposable: Subscription<any>;
  licensesQueryDisposable: Subscription<any>;
  @ViewChildren(LicenseForm)
  licenseForms: QueryList<LicenseForm>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private licensesService: LicensesService
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
      this.licensesStreamSubscription();
    }
  }

  query() {
    if (this.profile['@id']) {
      this.licensesQueryDisposable = this.licensesService
        .query({ profile: this.profile['@id'] })
        // required to subscribe to evaluate Observable 
        .subscribe(
          (licenses: LicenseModel[]) => {
            if (!licenses['hydra:member'].length) {
              // Make sure empty form is there if no events 
              this.ensureNInstaces();
            }
          },
          (error) => console.log('Error retrieving licenses ', error)
        );
    }
  }

  ngOnDestroy() {
    if (this.licensesQueryDisposable) {
      this.licensesQueryDisposable.unsubscribe();
    }
    if (this.licensesDisposable) {
      this.licensesDisposable.unsubscribe();
    }
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(license: LicenseModel) {
    console.log('onRemoveItem ', license, license.isNew());
    let deleteSuccess = (response) => {
      this.notificationsSvc.push(new NotificationModel({
        message: `license has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles license!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the educaiton?')) {
      if (license.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, license);
      } else {  // removing saved item
        // API call to remove the item
        this.licensesService.delete(license).subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.addModel({ profile: this.profile['@id'] });
    this.add.next(this.profile);
  }

  onSaveItem(license: LicenseModel) {
    let isSave = license.isNew();
    let method = isSave ? 'save' : 'update';
    this.licensesService[method](license)
      .subscribe(
        (response: LicenseModel) => {
          // TODO: Add (if new) or Update (if existing) event in this.items
          this.notificationsSvc.push(new NotificationModel({
            message: `license has been saved!`,
            type: 'success'
          }));
          // Make sure to remove the item from the unsavedItems list
          if (isSave) {
            this.unsavedItems = ArrayUtils.remove(this.unsavedItems, license);
            // this.ensureNInstaces();
          }
          this.licenseForms
            .filter(this.findFormWithModel(license))
            .forEach((form) => form.setMode(form.MODES.view));
          // this.item = response;
          // TODO: fix below by 
          // changing license.mode or @ContentChildren and set its mode from here!
          // this._setMode(this.MODES.view);
          // TODO: immutable below Object.assign(new LicenseModel(), response);
          this.saved.next({ license: response, method: method });
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's license!`,
            type: 'danger'
          }));
        }
      );
  }

  private findFormWithModel(license: LicenseModel) {
    return (form: LicenseForm)  => {
      return form.item['@id'] === license['@id'];
    };
  }

  private licensesStreamSubscription() {
    let profileId = this.profile['@id'];
    this.licensesDisposable = this.licensesService.$stream
        .map((state: ProfileLicensesList) => {
          return state.profileLicenses(profileId);
        })
        .subscribe(this.onProfileLicensesChanges.bind(this));
  }

  private onProfileLicensesChanges(profileLicenses: LicenseModel[]) {
    console.log('onProfileLicensesChanges ', profileLicenses);
    this.items = profileLicenses;
    // this.ensureNInstaces(1);
  }

  private addModel(license?: ILicense) {
    this.unsavedItems.push(this.getModel(license));
  }

  /**
   * @Override
   */
  private getModel(license?: ILicense): LicenseModel {
    let licenseModel = new LicenseModel(license);
    licenseModel = Object.assign(new LicenseModel({ cid: licenseModel.cid }), licenseModel);
    // LicenseModel.profile = this.profile['@id'];
    return licenseModel;
  }

  private ensureNInstaces(nrOfInstances: number = 1) {
    if (nrOfInstances > this.unsavedItems.length) {
      for (var index = this.unsavedItems.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }
}
