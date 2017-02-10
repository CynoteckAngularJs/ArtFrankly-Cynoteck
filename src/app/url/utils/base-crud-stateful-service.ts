import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs';
import 'rxjs/add/operator/share';
import {IProfileEditLD, ProfileEditLDModel} from '../../profiles/models/profiles';
import {ProfilesService} from '../../profiles/services/profiles-service';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';

let DEFAULTS = {};

export interface ICrudService {
  query(filter: any): Observable<any>;
  get(id: string): Observable<any>;
  delete(id: string): Observable<any>;
  save(model: any): Observable<any>;
  update(model: any): Observable<any>;
}


// AbstractCrudService -> to be implemented and injected as concrete impl
/*
1.
EventsCRUDService extends BaseCRUDService implements AbstractCrudService {
  ... crud operations changing stuff on server
}
2.
EventsStatefulCRUDService extends BaseStatefulCRUDService {
  constructor(
    // private service: AbstractCrudService
    // private profilesSrv: ProfilesService,
  ) {
    super(service, profilesSrv);
  }
}
3. Use EventsStatefulCRUDService in List Cmps
*/
@Injectable()
export class BaseStatefulCRUDService implements ICrudService {
  public $stream: BehaviorSubject<any>;
  // Application state representation
  private _data: any = Object.assign({}, DEFAULTS);

  constructor(
    // private service: AbstractCrudService
    // private profilesSrv: ProfilesService,
  ) {
    this._data = Object.assign({}, DEFAULTS);
    this.$stream = new BehaviorSubject(this._data);
  }

  query() {
    this.service.
  }

  get() {}

  delete() {}
  
  save() {}

  update() {}

  setMyProfiles(myProfiles: ProfileEditLDModel[]) {
    let data = Object.assign(this._data);
    data.myProfiles = [...myProfiles];
    data.action = ACTIONS.MY_PROFILE_SET;
    if (!data.selectedProfile && myProfiles.length) {
      this.setSelectedProfile(myProfiles[0]);
    }
    return this._setData(data);
  }

  /**
   * Function responsible for setting newly calculated data and notifying observers.
   */
  private _setData(data: any = DEFAULTS) {
    this._data = Object.assign({}, DEFAULTS, data);
    this.$stream.next(data);
    return data;
  }
}
