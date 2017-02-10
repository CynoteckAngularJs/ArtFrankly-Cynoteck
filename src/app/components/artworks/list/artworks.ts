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
import {ArtworkModel, IArtwork, DEFAULT_ARTWORK} from '../models';
import {ArtworksService, ProfileArtworksList} from '../services/artworks-service';
import {AppService, ACTIONS} from '../../authentication/services/app-service';
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {
  IProfileEditLD,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel
} from '../../profiles/models/profiles';
import {ArrayUtils} from '../../../url/utils/index';
import {ArtworkForm} from '../form/artwork';
// import {IFormListItem, IFormList} from '../models';

/**
 * <artwork-forms [items]="artworksFormList.items"
 *       [profile]="profile"
 *       (add)="artworksFormList.onItemAdd($event)">
 *     <artwork-form *ngFor="#artwork of artworksFormList.items"
 *               [item]="artwork"
 *               (removed)="artworksFormList.onItemRemoved($event)"
 *               (saved)="artworksFormList.onItemSaved($event)"
 *               (selected)="artworksFormList.onItemSelected($event)">
 *     </artwork-form>
 *   </artwork-forms>
 */
@Component({
  selector: 'artwork-forms',
  directives: [
    ...ROUTER_DIRECTIVES,
    ...FORM_DIRECTIVES,
    NgClass,
    ArtworkForm],
  providers: [],
  pipes: [JsonPipe],
  // styles: [ require('./artworks.css') ],
  template: require('./artworks.html')
})
@CanActivate(checkIfHasPermission)
export class ArtworkForms implements OnInit, OnChanges, OnDestroy {
  @Output() add: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Output() saved: EventEmitter<any> = new EventEmitter();
  // @Output() remove: EventEmitter<any> = new EventEmitter();
  // @Output() save: EventEmitter<any> = new EventEmitter();
  @Input() items: ArtworkModel[] = [];
  unsavedItems: ArtworkModel[] = [];
  /* tslint:disable */
  @Input() profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel = new ProfileProfessionalModel();
  /* tslint:enable */
  profileDisposable: Subscription<any>;
  artworksDisposable: Subscription<any>;
  artworksQueryDisposable: Subscription<any>;
  @ViewChildren(ArtworkForm)
  artworkForms: QueryList<ArtworkForm>;

  constructor(
      private router: Router,
      private location: Location,
      private routeParams: RouteParams,
      public appSrv: AppService,
      public notificationsSvc: NotificationsCollection,
      private artworksService: ArtworksService
  ) {}

  ngOnInit() {
    // this.query();
  }

  ngOnChanges(changes) {
    console.log('ngOnChange ', changes);
    let profile = changes.profile;
    let isProfileSet = profile && !profile.previousValue['@id'] && profile.currentValue['@id'];
    if (isProfileSet) {
      this.items = this.artworksService.setArtworks(this.profile['@id'], this.profile.artworks);
      this.artworksStreamSubscription();
    }
  }

  query() {
    if (this.profile['@id']) {
      this.artworksQueryDisposable = this.artworksService
        .query({ profile: this.profile['@id'] })
        // required to subscribe to evaluate Observable 
        .subscribe(
          (artworks: ArtworkModel[]) => console.log('artworks retrived ', artworks),
          (error) => console.log('Error retrieving artworks ', error)
        );
    }
  }

  ngOnDestroy() {
    if (this.artworksQueryDisposable) {
      this.artworksQueryDisposable.unsubscribe();
    }
    if (this.artworksDisposable) {
      this.artworksDisposable.unsubscribe();
    }
  }

  onItemSelected($event) {
    $event.preventDefault();
    // Rethrow event for parents listening
    this.selected.next($event);
  }

  onRemoveItem(artwork: ArtworkModel) {
    console.log('onRemoveItem ', artwork, artwork.isNew());
    let deleteSuccess = (response) => {
      this.notificationsSvc.push(new NotificationModel({
        message: `Artwork has been deleted!`,
        type: 'success'
      }));
    };
    let deleteFaliure = (response) => {
      console.log('ERROR: onItemRemove() ', response);
      this.notificationsSvc.push(new NotificationModel({
        message: `Error has occured while removing profiles artwork!`,
        type: 'danger'
      }));
    };
    if (confirm('Are you sure you want to delete the artwork?')) {
      if (artwork.isNew()) { // removing unsaved item
        this.unsavedItems = ArrayUtils.remove(this.unsavedItems, artwork);
      } else {  // removing saved item
        // API caartworkto remove the item
        this.artworksService
              .delete(artwork, this.profile['@id'])
              .subscribe(deleteSuccess, deleteFaliure);
      }
    }
  }

  onAddItem($event) {
    $event.preventDefault();
    this.addModel({ profile: this.profile['@id'] });
    this.add.next(this.profile);
  }

  onSaved($event) {
    let artwork = $event;
    this.unsavedItems = ArrayUtils.remove(this.unsavedItems, artwork);
    this.artworksService.addArtwork(artwork, this.profile['@id']);
    // this.item.update(response);
    // TODO: fix below by 
    // changing artwork.mode or @ContentChildren and set its mode from here!
    // this._setMode(this.MODES.view);
    // TODO: immutable below Object.assign(new ArtworkModel(), response);
    this.saved.next({ artwork: artwork, method: 'save' });
  }

  onRemoved($event) {
    let artwork = $event;
    this.artworksService.removeArtwork(artwork, this.profile['@id']);
  }

  onSaveItem(artwork: ArtworkModel) {
    let isSave = artwork.isNew();
    let method = isSave ? 'save' : 'update';
    this.artworksService[method](artwork, this.profile['@id'])
      .subscribe(
        (response: ArtworkModel) => {
          // TODO: Add (if new) or Update (if existing) event in this.items
          this.notificationsSvc.push(new NotificationModel({
            message: `Artwork has been saved!`,
            type: 'success'
          }));
          // Make sure to remove the item from the unsavedItems list
          if (isSave) {
            this.unsavedItems = ArrayUtils.remove(this.unsavedItems, artwork);
            // this.ensureNInstaces();
          }
          this.artworkForms
            .filter(this.findFormWithModel(artwork))
            .forEach((form) => form.setMode(form.MODES.view));
          // this.item.update(response);
          // TODO: fix below by 
          // changing artwork.mode or @ContentChildren and set its mode from here!
          // this._setMode(this.MODES.view);
          // TODO: immutable below Object.assign(new ArtworkModel(), response);
          this.saved.next({ artwork: response, method: method });
        },
        (response: any) => {
          console.log('ERROR: onSaveItem() ', response);
          this.notificationsSvc.push(new NotificationModel({
            message: `Error has occured while saving profile's artwork!`,
            type: 'danger'
          }));
        }
      );
  }

  get canAddMore() {
    // return this.unsavedItems.length < 1 && this.items.length < 1;
    return true;
  }

  private findFormWithModel(artwork: ArtworkModel) {
    return (form: ArtworkForm)  => {
      return form.item['@id'] === artwork['@id'];
    };
  }

  private artworksStreamSubscription() {
    let profileId = this.profile['@id'];
    this.artworksDisposable = this.artworksService.$stream
        .map((state: ProfileArtworksList) => {
          return state.profileArtworks(profileId);
        })
        .subscribe(this.onProfileArtworksChanges.bind(this));
  }

  private onProfileArtworksChanges(profileArtworks: ArtworkModel[]) {
    console.log('onProfileArtworksChanges ', profileArtworks);
    this.items = profileArtworks;
  }

  private addModel(artwork?: IArtwork) {
    this.unsavedItems.push(this.getModel(artwork));
  }

  /**
   * @Override
   */
  private getModel(artwork?: IArtwork): ArtworkModel {
    let artworkModel = new ArtworkModel(artwork);
    artworkModel = Object.assign(new ArtworkModel({ cid: artworkModel.cid }), artworkModel);
    // artworkModel.profile = this.profile['@id'];
    return artworkModel;
  }

  private ensureNInstaces(nrOfInstances: number = 1) {
    if (nrOfInstances > this.unsavedItems.length) {
      for (var index = this.unsavedItems.length; index < nrOfInstances; index++) {
        this.addModel();
      }
    }
  }
}
