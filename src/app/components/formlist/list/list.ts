import {Component, Input, Output, EventEmitter, OnInit, OnDestroy} from 'angular2/core';
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
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {PROFILE_TYPES} from '../../../constants';
import {
  IProfileEditLD,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel,
  BaseProfile
} from '../../profiles/models/profiles';
import {IFormListItem, IFormList} from '../models';

/**
 *
 * <formlist [items]="honors" 
 *      [addtext]="Add Media"
 *      (add)="onAddHonor()"
 *      (remove)="onRemoveHonor(honor)">
 *  <formlist-title>
 *    <h5>Honors and Awards</h5>
 *  </formlist-title>
 * 
 *  <formlist-body>
 *    <honor-form *ngFor="#item in items"
 *              [item]="item"
 *              (selected)="onItemSelected($event)"
 *              (removed)="onItemRemoved($event)">
 *    </honor-form>
 *  </formlist-body>
 *  <formlist-footer>
 *    <span>Add Event</span>
 *  </formlist-footer> 
 * </formlist>
 */
@Component({
  selector: 'formlist',
  directives: [ ...ROUTER_DIRECTIVES, ...FORM_DIRECTIVES, NgClass],
  providers: [],
  pipes: [JsonPipe],
  // styles: [ require('./list.css') ],
  template: require('./list.html')
})
@CanActivate(checkIfHasPermission)
export class FormList implements OnInit, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: any[] = [];
  /* tslint:disable */
  @Input() profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel = BaseProfile.create({
          type: PROFILE_TYPES.professional
        });
  /* tslint:enable */
  profileDisposable: Subscription<any>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService
  ) {
    this.profileDisposable = this.appSrv.$stream
      .filter((state) => state.action === ACTIONS.PROFILE_SELECTED)
      .map((state) => state.selectedProfile)
      .subscribe((profile) => this.profile = profile);

    // Make sure empty form is there if no events 
    if (this.items.length < 1) {
      this.add.next({});
    }
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.profileDisposable.unsubscribe();
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onAddItem($event, item: IFormListItem) {
    $event.preventDefault();
    this.add.next(this.profile);
  }

  // onSaveItem($event, item: IFormListItem) {
  //   $event.preventDefault();
  //   this.save.next({});
  // }

  // onRemoveItem(item: IFormListItem) {
  //   // this.items.remove(item);
  //   this.remove.next({ item: Object.assign(item) });
  // }

}
