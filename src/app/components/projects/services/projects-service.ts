import { Injectable } from 'angular2/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';

import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import { API } from '../../../config';
import { Utils, ArrayUtils } from '../../../url/utils/index';
import { HttpProxy } from '../../authentication/services/http-proxy';
import { IProject, ProjectModel } from '../models';
import { FeedModel, IFeedFilter } from '../../feed/models';

export interface IProfileProjects {
  profile: string;
  projects: ProjectModel[];
}

export class ProfileProjectsModel {
  constructor(public profile: string = '', public projects: ProjectModel[] = []) {
    if (!profile || !profile.trim().length) {
      throw new Error('Profile is required, but not provided!');
    }
  }
}

export class ProfileProjectsList {
  constructor(public data: ProfileProjectsModel[] = []) { }

  findIndex(profile: string) {
    return this.data.findIndex((item: ProfileProjectsModel) => item.profile === profile);
  }

  findByProfile(profile: string): ProfileProjectsModel {
    return this.data.find((item: ProfileProjectsModel) => item.profile === profile);
  }

  profileProjects(profile: string): ProjectModel[] {
    let profileEducation: ProfileProjectsModel = this.findByProfile(profile);
    return profileEducation && profileEducation.projects || [];
  }

  /**
   * Method used to set (push or update) profile projects.
   * If profile is not already found within data array it will push new item to data array.
   * Otherwise it will find and replace existing profile projects item with new one.
   */
  setProfileProjects(profileProjects: ProfileProjectsModel) {
    let index = this.findIndex(profileProjects.profile);
    if (index < 0) { // Not found in data
      this.data.push(profileProjects);
    } else { // Found in data
      // Update the item on provided index with new one
      this.data = [...this.data].map((item: ProfileProjectsModel, cindex: number) => {
        return cindex === index ? profileProjects : item;
      });
    }
  }

  addProject(education: ProjectModel) {
    let profileProjects: ProfileProjectsModel = this.findByProfile(education.profile);
    profileProjects.projects = [...profileProjects.projects, education];
    this.setProfileProjects(profileProjects);
  }

  updateProject(education: ProjectModel) {
    let profileProjects: ProfileProjectsModel = this.findByProfile(education.profile);
    profileProjects.projects = ArrayUtils.update(profileProjects.projects, education);
    this.setProfileProjects(profileProjects);
  }

  removeProject(education: ProjectModel) {
    let profileProjects: ProfileProjectsModel = this.findByProfile(education.profile);
    profileProjects.projects = ArrayUtils.remove(profileProjects.projects, education);
    this.setProfileProjects(profileProjects);
  }
}



export interface IProjectQuery {
  profile: string;
}

@Injectable()
export class ProfileIdService {
  public profileId: string;
  public localId: string;
  public flag: boolean = true;

  public featuredImage: any[] = [];
  public additionalImage: any[] = [];

  public defaultValue: any[] = [];

  public selectedFeed:string;

  public feed: IFeedFilter;
  constructor() {
    console.log('Creating AddressBookService');
  }

  unSetFeaturedImage() {
    this.featuredImage = this.defaultValue;
  }

  unSetAdditionalImage() {
    this.additionalImage = this.defaultValue;
  }

  setFeaturedImage(data: any) {
    this.featuredImage = data;
  }

  setAdditionalImage(data: any) {
    this.additionalImage = data;
  }

  getProfileId(): string {
    return this.profileId;
  }

  setProfileId(profileId: string): void {
    this.profileId = profileId;
  }

  setSearchFeed(f: IFeedFilter) {
    this.feed = f;
  }
  setSelectedFeed(type: string) {
    this.selectedFeed = type;
  }
}

@Injectable()
export class ProjectsService {
  public $stream: BehaviorSubject<ProfileProjectsList>;
  private _observer: any;
  // Application state representation
  private state: ProfileProjectsList = new ProfileProjectsList();

  constructor(public http: HttpProxy) {
    this.state = new ProfileProjectsList();
    this.$stream = new BehaviorSubject(this.state);
  }

  query(query: IProjectQuery): Observable<ProjectModel[]> {
    let _observable = this.http.get(API.PROJECTS, { search: Utils.toUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = this.setProjects(query.profile, response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // get(id: string, query?: any): Observable<HonorModel> {
  //   let URL = [API.PROJECTS, id].join('/');
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

  save(education: ProjectModel): Observable<ProjectModel> {
    let payload = education.serialize();
    let _observable = this.http.post(API.PROJECTS, JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: education.merge(response: IProject) instead of below line!
          education['@id'] = response['@id'];
          this.state.addProject(education);
          this.setState(this.state);
          observer.next(education);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(education: ProjectModel): Observable<ProjectModel> {
    let payload = education.serialize();
    let _observable = this.http.put(API.BASE + education['@id'], JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: education.merge(response: IProject)
          this.state.updateProject(education);
          this.setState(this.state);
          observer.next(education);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  delete(education: ProjectModel): Observable<ProjectModel> {
    let _observable = this.http.delete(API.BASE + education['@id']);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          this.state.removeProject(education);
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
  private setState(state: ProfileProjectsList = new ProfileProjectsList()) {
    let newState = Object.assign(new ProfileProjectsList(), state);
    this.state = newState;
    this.$stream.next(newState);
    return newState;
  }

  private setProjects(profile: string, response) {
    let _response = Object.assign({}, response);
    _response['hydra:member'] = [...response['hydra:member']]
      .map((education: IProject) => new ProjectModel(education));
    this.state.setProfileProjects(new ProfileProjectsModel(profile, _response['hydra:member']));
    this.setState(this.state);
    return _response;
  }

}
