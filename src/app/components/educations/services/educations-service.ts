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
import {IEducation, EducationModel} from '../models';

export interface IProfileEducations {
  profile: string;
  educations: EducationModel[];
}

export class ProfileEducationsModel {
  constructor(public profile: string = '', public educations: EducationModel[] = []) {
    if (!profile || !profile.trim().length) {
      throw new Error('Profile is required, but not provided!');
    }
  }
}

export class ProfileEducationsList {
  constructor(public data: ProfileEducationsModel[] = [] ) {}

  findIndex(profile: string) {
    return this.data.findIndex((item: ProfileEducationsModel) => item.profile === profile);
  }

  findByProfile(profile: string): ProfileEducationsModel {
    return this.data.find((item: ProfileEducationsModel) => item.profile === profile);
  }

  profileEducations(profile: string): EducationModel[] {
    let profileEducation: ProfileEducationsModel = this.findByProfile(profile);
    return profileEducation && profileEducation.educations || [];
  }

  /**
   * Method used to set (push or update) profile educations.
   * If profile is not already found within data array it will push new item to data array.
   * Otherwise it will find and replace existing profile educations item with new one.
   */
  setProfileEducations(profileEducations: ProfileEducationsModel) {
    let index = this.findIndex(profileEducations.profile);
    if (index < 0) { // Not found in data
      this.data.push(profileEducations);
    } else { // Found in data
      // Update the item on provided index with new one
      this.data = [...this.data].map((item: ProfileEducationsModel, cindex: number) => {
          return cindex === index ? profileEducations : item;
        });
    }
  }

  addEducation(education: EducationModel) {
    let profileEducations: ProfileEducationsModel = this.findByProfile(education.profile);
    profileEducations.educations = [...profileEducations.educations, education];
    this.setProfileEducations(profileEducations);
  }

  updateEducation(education: EducationModel) {
    let profileEducations: ProfileEducationsModel = this.findByProfile(education.profile);
    profileEducations.educations = ArrayUtils.update(profileEducations.educations, education);
    this.setProfileEducations(profileEducations);
  }

  removeEducation(education: EducationModel) {
    let profileEducations: ProfileEducationsModel = this.findByProfile(education.profile);
    profileEducations.educations = ArrayUtils.remove(profileEducations.educations, education);
    this.setProfileEducations(profileEducations);
  }
}

export interface IEducationQuery {
  profile: string;
}

@Injectable()
export class EducationsService {
  public $stream: BehaviorSubject<ProfileEducationsList>;
  private _observer: any;
  // Application state representation
  private state: ProfileEducationsList = new ProfileEducationsList();

  constructor(public http: HttpProxy) {
    this.state = new ProfileEducationsList();
    this.$stream = new BehaviorSubject(this.state);
  }

  query(query: IEducationQuery): Observable<EducationModel[]> {
    let _observable = this.http.get(API.EDUCATIONS, { search: Utils.toUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = this.setEducations(query.profile, response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // get(id: string, query?: any): Observable<HonorModel> {
  //   let URL = [API.EDUCATIONS, id].join('/');
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

  save(education: EducationModel): Observable<EducationModel> {
    let payload = education.serialize();
    let _observable = this.http.post(API.EDUCATIONS, JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: education.merge(response: IEducation) instead of below line!
          education['@id'] = response['@id'];
          this.state.addEducation(education);
          this.setState(this.state);
          observer.next(education);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(education: EducationModel): Observable<EducationModel> {
    let payload = education.serialize();
    let _observable = this.http.put(API.BASE + education['@id'], JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: education.merge(response: IEducation)
          this.state.updateEducation(education);
          this.setState(this.state);
          observer.next(education);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  delete(education: EducationModel): Observable<EducationModel> {
    let _observable = this.http.delete(API.BASE + education['@id']);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          this.state.removeEducation(education);
          this.setState(this.state);
          observer.next(education);
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
  private setState(state: ProfileEducationsList = new ProfileEducationsList()) {
    let newState = Object.assign(new ProfileEducationsList(), state);
    this.state = newState;
    this.$stream.next(newState);
    return newState;
  }

  private setEducations(profile: string, response) {
    let _response = Object.assign({}, response);
    _response['hydra:member'] = [...response['hydra:member']]
      .map((education: IEducation) => new EducationModel(education));
    this.state.setProfileEducations(new ProfileEducationsModel(profile, _response['hydra:member']));
    this.setState(this.state);
    return _response;
  }

}
