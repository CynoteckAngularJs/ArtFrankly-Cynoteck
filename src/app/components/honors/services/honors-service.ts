import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {API} from '../../../config';
import {Utils, ArrayUtils} from '../../../url/utils/index';
import {HttpProxy} from '../../authentication/services/http-proxy';
import {IHonor, HonorModel} from '../models';

export interface IProfileHonors {
  profile: string;
  honors: HonorModel[];
}

export class ProfileHonorsModel {
  constructor(public profile: string = '', public honors: HonorModel[] = []) {
    if (!profile || !profile.trim().length) {
      throw new Error('Profile is required, but not provided!');
    }
  }
}

export class ProfileHonorsList {
  constructor(public data: ProfileHonorsModel[] = [] ) {}

  findIndex(profile: string) {
    return this.data.findIndex((item: ProfileHonorsModel) => item.profile === profile);
  }

  findByProfile(profile: string): ProfileHonorsModel {
    return this.data.find((item: ProfileHonorsModel) => item.profile === profile);
  }

  profileHonors(profile: string): HonorModel[] {
    let profileHonor: ProfileHonorsModel = this.findByProfile(profile);
    return profileHonor && profileHonor.honors || [];
  }

  /**
   * Method used to set (push or update) profile honors.
   * If profile is not already found within data array it will push new item to data array.
   * Otherwise it will find and replace existing profile honors item with new one.
   */
  setProfileHonors(profileHonors: ProfileHonorsModel) {
    let index = this.findIndex(profileHonors.profile);
    if (index < 0) { // Not found in data
      this.data.push(profileHonors);
    } else { // Found in data
      // Update the item on provided index with new one
      this.data = [...this.data].map((item: ProfileHonorsModel, cindex: number) => {
          return cindex === index ? profileHonors : item;
        });
    }
  }

  addHonor(honor: HonorModel) {
    let profileHonors: ProfileHonorsModel = this.findByProfile(honor.profile);
    profileHonors.honors = [...profileHonors.honors, honor];
    this.setProfileHonors(profileHonors);
  }

  updateHonor(honor: HonorModel) {
    let profileHonors: ProfileHonorsModel = this.findByProfile(honor.profile);
    profileHonors.honors = ArrayUtils.update(profileHonors.honors, honor);
    this.setProfileHonors(profileHonors);
  }

  removeHonor(honor: HonorModel) {
    let profileHonors: ProfileHonorsModel = this.findByProfile(honor.profile);
    profileHonors.honors = ArrayUtils.remove(profileHonors.honors, honor);
    this.setProfileHonors(profileHonors);
  }
}

export interface IHonorQuery {
  profile: string;
}

@Injectable()
export class HonorsService {
  public $stream: BehaviorSubject<ProfileHonorsList>;
  private _observer: any;
  // Application state representation
  private state: ProfileHonorsList = new ProfileHonorsList();

  constructor(public http: HttpProxy) {
    this.state = new ProfileHonorsList();
    this.$stream = new BehaviorSubject(this.state);
  }

  query(query: IHonorQuery): Observable<HonorModel[]> {
    let _observable = this.http.get(API.HONORS, { search: Utils.toUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = this.setHonors(query.profile, response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // get(id: string, query?: any): Observable<HonorModel> {
  //   let URL = [API.HONORS, id].join('/');
  //   let _observable = this.http.get(URL, { search: Utils.toUrlParams(query) });
  //   return new Observable((observer) => {
  //     _observable.subscribe(
  //       (response) => {
  //         let honor = new HonorModel(response);
  //         observer.next(honor);
  //       },
  //       (error) => observer.error(error),
  //       () => observer.complete()
  //     );
  //   });
  // }

  save(honor: HonorModel): Observable<HonorModel> {
    let payload = honor.serialize();
    let _observable = this.http.post(API.HONORS, JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: honor.merge(response: IHonor) instead of below line!
          honor['@id'] = response['@id'];
          this.state.addHonor(honor);
          this.setState(this.state);
          observer.next(honor);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(honor: HonorModel): Observable<HonorModel> {
    let payload = honor.serialize();
    let _observable = this.http.put(API.BASE + honor['@id'], JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: honor.merge(response: IHonor)
          this.state.updateHonor(honor);
          this.setState(this.state);
          observer.next(honor);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  delete(honor: HonorModel): Observable<HonorModel> {
    let _observable = this.http.delete(API.BASE + honor['@id']);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          this.state.removeHonor(honor);
          this.setState(this.state);
          observer.next(honor);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  /**
   * Method setting newly calculated data and notifying observers.
   * To be overridden by extended classes
   */
  private setState(state: ProfileHonorsList = new ProfileHonorsList()) {
    let newState = Object.assign(new ProfileHonorsList(), state);
    this.state = newState;
    this.$stream.next(newState);
    return newState;
  }

  private setHonors(profile: string, response) {
    let _response = Object.assign({}, response);
    _response['hydra:member'] = [...response['hydra:member']]
      .map((honor: IHonor) => new HonorModel(honor));
    this.state.setProfileHonors(new ProfileHonorsModel(profile, _response['hydra:member']));
    this.setState(this.state);
    return _response;
  }

}
