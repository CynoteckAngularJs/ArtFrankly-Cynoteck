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
import {IExperience, ExperienceModel} from '../models';

export interface IProfileExperiences {
  profile: string;
  experiences: ExperienceModel[];
}

export class ProfileExperiencesModel {
  constructor(public profile: string = '', public experiences: ExperienceModel[] = []) {
    if (!profile || !profile.trim().length) {
      throw new Error('Profile is required, but not provided!');
    }
  }
}

export class ProfileExperiencesList {
  constructor(public data: ProfileExperiencesModel[] = [] ) {}

  findIndex(profile: string) {
    return this.data.findIndex((item: ProfileExperiencesModel) => item.profile === profile);
  }

  findByProfile(profile: string): ProfileExperiencesModel {
    return this.data.find((item: ProfileExperiencesModel) => item.profile === profile);
  }

  profileExperiences(profile: string): ExperienceModel[] {
    let profileExperience: ProfileExperiencesModel = this.findByProfile(profile);
    return profileExperience && profileExperience.experiences || [];
  }

  /**
   * Method used to set (push or update) profile experiences.
   * If profile is not already found within data array it will push new item to data array.
   * Otherwise it will find and replace existing profile experiences item with new one.
   */
  setProfileExperiences(profileExperiences: ProfileExperiencesModel) {
    let index = this.findIndex(profileExperiences.profile);
    if (index < 0) { // Not found in data
      this.data.push(profileExperiences);
    } else { // Found in data
      // Update the item on provided index with new one
      this.data = [...this.data].map((item: ProfileExperiencesModel, cindex: number) => {
          return cindex === index ? profileExperiences : item;
        });
    }
  }

  addExperience(experience: ExperienceModel) {
    let profileExperiences: ProfileExperiencesModel = this.findByProfile(experience.profile);
    profileExperiences.experiences = [...profileExperiences.experiences, experience];
    this.setProfileExperiences(profileExperiences);
  }

  updateExperience(experience: ExperienceModel) {
    let profileExperiences: ProfileExperiencesModel = this.findByProfile(experience.profile);
    profileExperiences.experiences = ArrayUtils.update(profileExperiences.experiences, experience);
    this.setProfileExperiences(profileExperiences);
  }

  removeExperience(experience: ExperienceModel) {
    let profileExperiences: ProfileExperiencesModel = this.findByProfile(experience.profile);
    profileExperiences.experiences = ArrayUtils.remove(profileExperiences.experiences, experience);
    this.setProfileExperiences(profileExperiences);
  }
}

export interface IExperienceQuery {
  profile: string;
}

@Injectable()
export class ExperiencesService {
  public $stream: BehaviorSubject<ProfileExperiencesList>;
  private _observer: any;
  // Application state representation
  private state: ProfileExperiencesList = new ProfileExperiencesList();

  constructor(public http: HttpProxy) {
    this.state = new ProfileExperiencesList();
    this.$stream = new BehaviorSubject(this.state);
  }

  query(query: IExperienceQuery): Observable<ExperienceModel[]> {
    let _observable = this.http.get(API.EXPERIENCES, { search: Utils.toUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = this.setExperiences(query.profile, response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // get(id: string, query?: any): Observable<HonorModel> {
  //   let URL = [API.EXPERIENCES, id].join('/');
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

  save(experience: ExperienceModel): Observable<ExperienceModel> {
    let payload = experience.serialize();
    let _observable = this.http.post(API.EXPERIENCES, JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: experience.merge(response: IExperience) instead of below line!
          experience['@id'] = response['@id'];
          this.state.addExperience(experience);
          this.setState(this.state);
          observer.next(experience);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(experience: ExperienceModel): Observable<ExperienceModel> {
    let payload = experience.serialize();
    let _observable = this.http.put(API.BASE + experience['@id'], JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: experience.merge(response: IExperience)
          this.state.updateExperience(experience);
          this.setState(this.state);
          observer.next(experience);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  delete(experience: ExperienceModel): Observable<ExperienceModel> {
    let _observable = this.http.delete(API.BASE + experience['@id']);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          this.state.removeExperience(experience);
          this.setState(this.state);
          observer.next(experience);
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
  private setState(state: ProfileExperiencesList = new ProfileExperiencesList()) {
    let newState = Object.assign(new ProfileExperiencesList(), state);
    this.state = newState;
    this.$stream.next(newState);
    return newState;
  }

  private setExperiences(profile: string, response) {
    let _response = Object.assign({}, response);
    _response['hydra:member'] = [...response['hydra:member']]
      .map((experience: IExperience) => new ExperienceModel(experience));
    this.state.setProfileExperiences(
      new ProfileExperiencesModel(profile, _response['hydra:member'])
    );
    this.setState(this.state);
    return _response;
  }

}
