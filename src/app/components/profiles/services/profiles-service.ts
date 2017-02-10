import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {
  IProfile,
  IProfileEditLD,
  IProfileEdit,
  ProfileEditLDModel,
  IProfessionalGeneral,
  IInstitutionGeneral,
  IVendorGeneral,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel,
  BaseProfile
} from '../models/profiles';
import {API} from '../../../config';
import {PROFILE_TYPES, PROFILES, ROUTES} from '../../../constants';
import {HttpProxy} from '../../authentication/services/http-proxy';
import {ArtworkModel} from '../../artworks/models';

export class ProfileSerializer {
  static serialize() {}

  static deserialize(
    profile: IProfileEditLD = {}
  ): ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel {
    if (profile.artworks) {
      profile.artworks = (profile.artworks || [])
        .map((artwork) => new ArtworkModel(artwork));
    }
    // return new ProfileEditLDModel(profile);
    let ClassType = BaseProfile.getClassType(profile.type);
    return new ClassType(profile);
  }
}

@Injectable()
export class ProfilesService {
  constructor(public http: HttpProxy) {}

  query(
    params: any = {}
  ): Observable<(ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel)[]> {
    let _observable = this.http.get(API.PROFILES);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          response['hydra:member'] = (response['hydra:member'] || [])
            .map(ProfileSerializer.deserialize);
          observer.next(response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  myProfiles(params: any = {}): Observable<IProfileEditLD[]> {
    let _observable = this.http.get(API.MYPROFILES);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          response['hydra:member'] = (response['hydra:member'] || [])
            .map(ProfileSerializer.deserialize);
          observer.next(response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  get(resourcePath: string): Observable<IProfileEditLD> {
    let _observable = this.http.get(API.BASE + resourcePath);
    console.log(resourcePath);
    console.log(_observable);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(ProfileSerializer.deserialize(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  preview(resourcePath: string): Observable<IProfileEditLD> {
    let URL = [API.BASE, resourcePath, 'preview'].join('/');
    let _observable = this.http.get(URL);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(ProfileSerializer.deserialize(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  save(profile: IProfileEditLD): Observable<IProfileEditLD> {
    let URL = '';
    if (profile.type === PROFILE_TYPES.professional) {
      URL = API.PROFESSIONALS;
    } else if (profile.type === PROFILE_TYPES.vendor) {
      URL = API.VENDORS;
    } else if (profile.type === PROFILE_TYPES.institution) {
      URL = API.INSTITUTIONS;
    }
    let _observable = this.http.post(URL, JSON.stringify(profile));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(ProfileSerializer.deserialize(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(
    profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel
  ): Observable<IProfessionalGeneral|IInstitutionGeneral|IVendorGeneral> {
    let resourcePath = profile['@id'];
    // return this.http.put(API.BASE + resourcePath, JSON.stringify(profile.serialize()));
    let _observable = this.http.put(API.BASE + resourcePath, JSON.stringify(profile.serialize()));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(ProfileSerializer.deserialize(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }
}
