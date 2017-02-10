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
import {ArtistModel, IArtist, DEFAULT_ARTIST} from '../models';
import {ArtistsService, ProfileArtistsList} from '../services/artists-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {ArrayUtils} from '../../../url/utils/index';
import {ArtistForm} from '../form/artist';
// import {IFormListItem, IFormList} from '../models';

/**
 * <artist-forms [items]="artistsFormList.items"
 *       [profile]="profile"
 *       (add)="artistsFormList.onItemAdd($event)">
 *     <artist-form *ngFor="#artist of artistsFormList.items"
 *               [item]="artist"
 *               (removed)="artistsFormList.onItemRemoved($event)"
 *               (saved)="artistsFormList.onItemSaved($event)"
 *               (selected)="artistsFormList.onItemSelected($event)">
 *     </artist-form>
 *   </artist-forms>
 */
@Component({
  selector: 'artist-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    ArtistForm],
  providers: [],
  pipes: [JsonPipe],
  // styles: [ require('./artists.css') ],
  template: require('./artists.html')
})
@CanActivate(checkIfHasPermission)
export class ArtistForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: ArtistModel[] = [];
  unsavedItems: ArtistModel[] = [];
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  profileDisposable: Subscription<any>;
  artistsDisposable: Subscription<any>;
  artistsQueryDisposable: Subscription<any>;
  @ViewChildren(ArtistForm)
  artistForms: QueryList<ArtistForm>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private artistsService: ArtistsService
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
      this.artistsStreamSubscription();
    }
  }

  query() {
    if (this.profile['@id']) {
      this.artistsQueryDisposable = this.artistsService
        .query({ profile: this.profile['@id'] })
        // required to subscribe to evaluate Observable 
        .subscribe(
          (artists: ArtistModel[]) => {
            if (!artists['hydra:member'].length) {
              // Make sure empty form is there if no events 
              this.ensureNInstaces();
            }
          },
          (error) => console.log('Error retrieving artists ', error)
        );
    }
  }

  ngOnDestroy() {
    if (this.artistsQueryDisposable) {
      this.artistsQueryDisposable.unsubscribe();
    }
    if (this.artistsDisposable) {
      this.artistsDisposable.unsubscribe();
    }
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(artist: ArtistModel) {
    console.log('onRemoveItem ', artist, artist.isNew());
    let deleteSuccess = (response) => {
      this.notificationsSvc.push(new NotificationModel({
        message: `Artist has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles artist!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the artist?')) {
      if (artist.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, artist);
      } else {  // removing saved item
        // API caartistto remove the item
        this.artistsService.delete(artist).subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.addModel({ profile: this.profile['@id'] });
    this.add.next(this.profile);
  }

  onSaveItem(artist: ArtistModel) {
    let isSave = artist.isNew();
    let method = isSave ? 'save' : 'update';
    this.artistsService[method](artist)
      .subscribe(
        (response: ArtistModel) => {
          // TODO: Add (if new) or Update (if existing) event in this.items
          this.notificationsSvc.push(new NotificationModel({
            message: `Artist has been saved!`,
            type: 'success'
          }));
          // Make sure to remove the item from the unsavedItems list
          if (isSave) {
            this.unsavedItems = ArrayUtils.remove(this.unsavedItems, artist);
            // this.ensureNInstaces();
          }
          this.artistForms
            .filter(this.findFormWithModel(artist))
            .forEach((form) => form.setMode(form.MODES.view));
          // this.item = response;
          // TODO: fix below by 
          // changing artist.mode or @ContentChildren and set its mode from here!
          // this._setMode(this.MODES.view);
          // TODO: immutable below Object.assign(new ArtistModel(), response);
          this.saved.next({ artist: response, method: method });
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's artist!`,
            type: 'danger'
          }));
        }
      );
  }

  private findFormWithModel(artist: ArtistModel) {
    return (form: ArtistForm)  => {
      return form.item['@id'] === artist['@id'];
    };
  }

  private artistsStreamSubscription() {
    let profileId = this.profile['@id'];
    this.artistsDisposable = this.artistsService.$stream
        .map((state: ProfileArtistsList) => {
          return state.profileArtists(profileId);
        })
        .subscribe(this.onProfileArtistsChanges.bind(this));
  }

  private onProfileArtistsChanges(profileArtists: ArtistModel[]) {
    console.log('onProfileArtistsChanges ', profileArtists);
    this.items = profileArtists;
    // this.ensureNInstaces(1);
  }

  private addModel(artist?: IArtist) {
    this.unsavedItems.push(this.getModel(artist));
  }

  /**
   * @Override
   */
  private getModel(artist?: IArtist): ArtistModel {
    let artistModel = new ArtistModel(artist);
    artistModel = Object.assign(new ArtistModel({ cid: artistModel.cid }), artistModel);
    // artistModel.profile = this.profile['@id'];
    return artistModel;
  }

  private ensureNInstaces(nrOfInstances: number = 1) {
    if (nrOfInstances > this.unsavedItems.length) {
      for (var index = this.unsavedItems.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }
}
