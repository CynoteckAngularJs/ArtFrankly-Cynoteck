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
import {EventModel, IEvent, DEFAULT_EVENT} from '../models';
import {EventsService, ProfileEventsList} from '../services/events-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {ArrayUtils} from '../../../url/utils/index';
import {EventForm} from '../form/event';
// import {IFormListItem, IFormList} from '../models';

/**
 * <event-forms [items]="eventsFormList.items"
 *       [profile]="profile"
 *       (add)="eventsFormList.onItemAdd($event)">
 *     <event-form *ngFor="#event of eventsFormList.items"
 *               [item]="event"
 *               (removed)="eventsFormList.onItemRemoved($event)"
 *               (saved)="eventsFormList.onItemSaved($event)"
 *               (selected)="eventsFormList.onItemSelected($event)">
 *     </event-form>
 *   </event-forms>
 */
@Component({
  selector: 'event-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    EventForm],
  providers: [],
  pipes: [JsonPipe],
  // styles: [ require('./events.css') ],
  template: require('./events.html')
})
@CanActivate(checkIfHasPermission)
export class EventForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: EventModel[] = [];
  unsavedItems: EventModel[] = [];
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  profileDisposable: Subscription<any>;
  eventsDisposable: Subscription<any>;
  eventsQueryDisposable: Subscription<any>;
  @ViewChildren(EventForm)
  eventForms: QueryList<EventForm>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private eventsService: EventsService
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
      this.eventsStreamSubscription();
    }
  }

  query() {
    if (this.profile['@id']) {
      this.eventsQueryDisposable = this.eventsService
        .query({ profile: this.profile['@id'] })
        // required to subscribe to evaluate Observable 
        .subscribe(
          (events: EventModel[]) => {
            if (!events['hydra:member'].length) {
              // Make sure empty form is there if no events 
              this.ensureNInstaces();
            }
          },
          (error) => console.log('Error retrieving events ', error)
        );
    }
  }

  ngOnDestroy() {
    if (this.eventsQueryDisposable) {
      this.eventsQueryDisposable.unsubscribe();
    }
    if (this.eventsDisposable) {
      this.eventsDisposable.unsubscribe();
    }
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(event: EventModel) {
    console.log('onRemoveItem ', event, event.isNew());
    let deleteSuccess = (response) => {
      // ensure views are deleted
      // this.eventForms
      //     .filter(this.findFormWithModel(event))
      //     .forEach((form) => form.setMode(form.MODES.view));
      this.notificationsSvc.push(new NotificationModel({
        message: `Event has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles event!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the event?')) {
      if (event.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, event);
      } else {  // removing saved item
        // API call to remove the item
        this.eventsService.delete(event).subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.addModel({ profile: this.profile['@id'] });
    this.add.next(this.profile);
  }

  onSavedItem($event: {event: EventModel, method: string}) {
    let event = $event.event;
    // Make sure to remove the item from the unsavedItems list
    // if (event.isNew()) {
    if ($event.method === 'save') {
      this.unsavedItems = ArrayUtils.remove(this.unsavedItems, event);
      // this.ensureNInstaces();
    }
    // propagate event further
    this.saved.next($event);
  }

  private findFormWithModel(event: EventModel) {
    return (form: EventForm)  => {
      return form.item['@id'] === event['@id'];
    };
  }

  private eventsStreamSubscription() {
    let profileId = this.profile['@id'];
    this.eventsDisposable = this.eventsService.$stream
        .map((state: ProfileEventsList) => {
          return state.profileEvents(profileId);
        })
        .subscribe(this.onProfileEventsChanges.bind(this));
  }

  private onProfileEventsChanges(profileEvents: EventModel[]) {
    console.log('onProfileEventsChanges ', profileEvents);
    this.items = profileEvents;
    // this.ensureNInstaces(1);
  }

  private addModel(event?: IEvent) {
    this.unsavedItems.push(this.getModel(event));
  }

  /**
   * @Override
   */
  private getModel(event?: IEvent): EventModel {
    let eventModel = new EventModel(event);
    eventModel = Object.assign(new EventModel({ cid: eventModel.cid }), eventModel);
    // eventModel.profile = this.profile['@id'];
    return eventModel;
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
export class EventsFormList {
  // @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  items: EventModel[] = [];

  constructor(
      @Inject(EventsService) private itemsService?: EventsService,
      @Inject(NotificationsCollection) private notificationsSvc?: NotificationsCollection
  ) {
    this.ensureNInstaces(1);
    // this.itemsService.$stream
      // .map((state: ProfileEventsList) => state.findByProfile(this.profile))
      // .subscribe(this.onStateChange);
  }

  onItemSelect($event) {}

  onItemAdd(profile) {
    let evt = Object.assign({}, DEFAULT_EVENT, { profile: profile['@id'] });
    this.addModel(evt);
  }

  onItemSaved($event: EventModel) {
    // Nothing to do (Form aleady exists and is handled internally)
  }

  onItemRemoved(eventModel: EventModel) {
    // TODO: Find and Remove event from this.items (destroy the View implicitly!)
    this.items = ArrayUtils.remove(this.items, eventModel);
  }

  query(filter: any = {}) {
    let params = Object.assign({}, filter);
    this.itemsService.query(params);
    // .subscribe(
    //   (response: EventModel) => {
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

  private addModel(event?: IEvent) {
    this.items.push(this.getModel(event));
  }

  /**
   * @Override
   */
  private getModel(event?: IEvent): EventModel {
    let eventModel = new EventModel(event);
    eventModel = Object.assign(new EventModel({ cid: eventModel.cid }), eventModel);
    // eventModel.profile = this.profile['@id'];
    return eventModel;
  }

  private ensureNInstaces(nrOfInstances: number) {
    if (nrOfInstances > this.items.length) {
      for (var index = this.items.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }

  private onStateChange(state: ProfileEventsList) {}
}
