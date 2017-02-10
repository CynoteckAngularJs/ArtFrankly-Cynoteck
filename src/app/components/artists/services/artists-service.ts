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
import {IArtist, ArtistModel} from '../models';

export interface IProfileArtists {
  profile: string;
  artists: ArtistModel[];
}

export class ProfileArtistsModel {
  constructor(public profile: string = '', public artists: ArtistModel[] = []) {
    if (!profile || !profile.trim().length) {
      throw new Error('Profile is required, but not provided!');
    }
  }
}

export class ProfileArtistsList {
  constructor(public data: ProfileArtistsModel[] = [] ) {}

  findIndex(profile: string) {
    return this.data.findIndex((item: ProfileArtistsModel) => item.profile === profile);
  }

  findByProfile(profile: string): ProfileArtistsModel {
    return this.data.find((item: ProfileArtistsModel) => item.profile === profile);
  }

  profileArtists(profile: string): ArtistModel[] {
    let profileArtist: ProfileArtistsModel = this.findByProfile(profile);
    return profileArtist && profileArtist.artists || [];
  }

  /**
   * Method used to set (push or update) profile artists.
   * If profile is not already found within data array it will push new item to data array.
   * Otherwise it will find and replace existing profile artists item with new one.
   */
  setProfileArtists(profileArtists: ProfileArtistsModel) {
    let index = this.findIndex(profileArtists.profile);
    if (index < 0) { // Not found in data
      this.data.push(profileArtists);
    } else { // Found in data
      // Update the item on provided index with new one
      this.data = [...this.data].map((item: ProfileArtistsModel, cindex: number) => {
          return cindex === index ? profileArtists : item;
        });
    }
  }

  addArtist(artist: ArtistModel) {
    let profileArtists: ProfileArtistsModel = this.findByProfile(artist.profile);
    profileArtists.artists = [...profileArtists.artists, artist];
    this.setProfileArtists(profileArtists);
  }

  updateArtist(artist: ArtistModel) {
    let profileArtists: ProfileArtistsModel = this.findByProfile(artist.profile);
    profileArtists.artists = ArrayUtils.update(profileArtists.artists, artist);
    this.setProfileArtists(profileArtists);
  }

  removeArtist(artist: ArtistModel) {
    let profileArtists: ProfileArtistsModel = this.findByProfile(artist.profile);
    profileArtists.artists = ArrayUtils.remove(profileArtists.artists, artist);
    this.setProfileArtists(profileArtists);
  }
}

export interface IArtistQuery {
  profile: string;
}

@Injectable()
export class ArtistsService {
  public $stream: BehaviorSubject<ProfileArtistsList>;
  private _observer: any;
  // Application state representation
  private state: ProfileArtistsList = new ProfileArtistsList();

  constructor(public http: HttpProxy) {
    this.state = new ProfileArtistsList();
    this.$stream = new BehaviorSubject(this.state);
  }

  query(query: IArtistQuery): Observable<ArtistModel[]> {
    let _observable = this.http.get(API.ARTISTS, { search: Utils.toUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = this.setArtists(query.profile, response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // get(id: string, query?: any): Observable<HonorModel> {
  //   let URL = [API.ARTISTS, id].join('/');
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

  save(artist: ArtistModel): Observable<ArtistModel> {
    let payload = artist.serialize();
    let _observable = this.http.post(API.ARTISTS, JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: artist.merge(response: IArtist) instead of below line!
          artist['@id'] = response['@id'];
          this.state.addArtist(artist);
          this.setState(this.state);
          observer.next(artist);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(artist: ArtistModel): Observable<ArtistModel> {
    let payload = artist.serialize();
    let _observable = this.http.put(API.BASE + artist['@id'], JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: artist.merge(response: IArtist)
          this.state.updateArtist(artist);
          this.setState(this.state);
          observer.next(artist);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  delete(artist: ArtistModel): Observable<ArtistModel> {
    let _observable = this.http.delete(API.BASE + artist['@id']);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          this.state.removeArtist(artist);
          this.setState(this.state);
          observer.next(artist);
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
  private setState(state: ProfileArtistsList = new ProfileArtistsList()) {
    let newState = Object.assign(new ProfileArtistsList(), state);
    this.state = newState;
    this.$stream.next(newState);
    return newState;
  }

  private setArtists(profile: string, response) {
    let _response = Object.assign({}, response);
    _response['hydra:member'] = [...response['hydra:member']]
      .map((artist: IArtist) => new ArtistModel(artist));
    this.state.setProfileArtists(new ProfileArtistsModel(profile, _response['hydra:member']));
    this.setState(this.state);
    return _response;
  }

}
