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
import {IArtwork, ArtworkModel} from '../models';

export interface IProfileArtworks {
  profile: string;
  artworks: ArtworkModel[];
}

export class ProfileArtworksModel {
  constructor(public profile: string = '', public artworks: ArtworkModel[] = []) {
    if (!profile || !profile.trim().length) {
      throw new Error('Profile is required, but not provided!');
    }
  }
}

export class ProfileArtworksList {
  constructor(public data: ProfileArtworksModel[] = [] ) {}

  findIndex(profile: string) {
    return this.data.findIndex((item: ProfileArtworksModel) => item.profile === profile);
  }

  findByProfile(profile: string): ProfileArtworksModel {
    return this.data.find((item: ProfileArtworksModel) => item.profile === profile);
  }

  profileArtworks(profile: string): ArtworkModel[] {
    let profileArtwork: ProfileArtworksModel = this.findByProfile(profile);
    return profileArtwork && profileArtwork.artworks || [];
  }

  /**
   * Method used to set (push or update) profile artworks.
   * If profile is not already found within data array it will push new item to data array.
   * Otherwise it will find and replace existing profile artworks item with new one.
   */
  setProfileArtworks(profileArtworks: ProfileArtworksModel) {
    let index = this.findIndex(profileArtworks.profile);
    if (index < 0) { // Not found in data
      this.data.push(profileArtworks);
    } else { // Found in data
      // Update the item on provided index with new one
      this.data = [...this.data].map((item: ProfileArtworksModel, cindex: number) => {
          return cindex === index ? profileArtworks : item;
        });
    }
  }

  addArtwork(artwork: ArtworkModel, profile: string) {
    let profileArtworks: ProfileArtworksModel = this.findByProfile(profile);
    if (profileArtworks) {
      profileArtworks.artworks = [...profileArtworks.artworks, artwork];
      this.setProfileArtworks(profileArtworks);
    }
  }

  updateArtwork(artwork: ArtworkModel, profile: string) {
    let profileArtworks: ProfileArtworksModel = this.findByProfile(profile);
    if (profileArtworks) {
      profileArtworks.artworks = ArrayUtils.update(profileArtworks.artworks, artwork);
      this.setProfileArtworks(profileArtworks);
    }
  }

  removeArtwork(artwork: ArtworkModel, profile: string) {
    let profileArtworks: ProfileArtworksModel = this.findByProfile(profile);
    if (profileArtworks) {
      profileArtworks.artworks = ArrayUtils.remove(profileArtworks.artworks, artwork);
      this.setProfileArtworks(profileArtworks);
    }
  }
}

export interface IArtworkQuery {
  profile: string;
}

@Injectable()
export class ArtworksService {
  public $stream: BehaviorSubject<ProfileArtworksList>;
  private _observer: any;
  // Application state representation
  private state: ProfileArtworksList = new ProfileArtworksList();

  constructor(public http: HttpProxy) {
    this.state = new ProfileArtworksList();
    this.$stream = new BehaviorSubject(this.state);
  }

  query(query: IArtworkQuery): Observable<ArtworkModel[]> {
    let _observable = this.http.get(API.ARTWORKS, { search: Utils.toUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = this.setArtworks(query.profile, response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // get(id: string, query?: any): Observable<HonorModel> {
  //   let URL = [API.ARTWORKS, id].join('/');
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

  addArtwork(artwork: ArtworkModel, profile: string) {
    this.state.addArtwork(artwork, profile);
    this.setState(this.state);
  }

  save(artwork: ArtworkModel, profile: string): Observable<ArtworkModel> {
    let payload = artwork.serialize();
    let _observable = this.http.post(API.ARTWORKS, JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: artwork.merge(response: IArtwArtworkstead of below line!
          artwork['@id'] = response['@id'];
          this.addArtwork(artwork, profile);
          observer.next(artwork);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(artwork: ArtworkModel, profile: string): Observable<ArtworkModel> {
    let payload = artwork.serialize();
    let _observable = this.http.put(API.BASE + artwork['@id'], JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: artwork.merge(response: IArtwork)
          this.state.updateArtwork(artwork, profile);
          this.setState(this.state);
          observer.next(artwork);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  removeArtwork(artwork: ArtworkModel, profile: string) {
    this.state.removeArtwork(artwork, profile);
    this.setState(this.state);
  }

  delete(artwork: ArtworkModel, profile: string): Observable<ArtworkModel> {
    let mediaId = Utils.extractIdFromIRI(artwork.mediaObject['@id']);
    // let _observable = this.http.delete(API.BASE + artwork['@id']);
    let _observable = this.http.delete([API.UPLOADS, mediaId].join('/'));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          this.removeArtwork(artwork, profile);
          observer.next(artwork);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  setArtworks(profile: string, artworks: IArtwork[]) {
    // let _response = Object.assign({}, response);
    // _response['hydra:member'] = [...response['hydra:member']]
    let artworkModels = (artworks || [])
      .map((artwork: IArtwork) => new ArtworkModel(artwork));
    this.state.setProfileArtworks(new ProfileArtworksModel(profile, artworkModels));
    this.setState(this.state);
    return artworkModels;
  }

  /**
   * Method setting newly calculated data and notifying observers.
   * To be overridden by extended classes
   */
  private setState(state: ProfileArtworksList = new ProfileArtworksList()) {
    let newState = Object.assign(new ProfileArtworksList(), state);
    this.state = newState;
    this.$stream.next(newState);
    return newState;
  }
}
