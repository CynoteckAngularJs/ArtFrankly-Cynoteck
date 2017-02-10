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
import {
  Utils,
  ArrayUtils,
  IUpload,
  UploadModel
} from '../../../url/utils/index';
import {HttpProxy} from '../../authentication/services/http-proxy';

@Injectable()
export class UploadsService {
  // public $stream: BehaviorSubject<any>;
  // private _observer: any;
  // Application state representation
  // private state: ProfileEducationsList = new ProfileEducationsList();

  constructor(public http: HttpProxy) {
    // this.state = new ProfileEducationsList();
    // this.$stream = new BehaviorSubject(this.state);
  }

  query(query?: any): Observable<UploadModel[]> {
    let _observable = this.http.get(API.UPLOADS, { search: Utils.toUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // let _response = this.setEducations(query.profile, response);
          let medias = response['hydra:member'] || [];
          let _response = medias.map((item) => new UploadModel(item));
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

  // save(upload: EducationModel): Observable<EducationModel> {
  //   let payload = education.serialize();
  //   let _observable = this.http.post(API.EDUCATIONS, JSON.stringify(payload));
  //   return new Observable((observer) => {
  //     _observable.subscribe(
  //       (response) => {
  //         // TODO: education.merge(response: IEducation) instead of below line!
  //         education['@id'] = response['@id'];
  //         this.state.addEducation(education);
  //         this.setState(this.state);
  //         observer.next(education);
  //       },
  //       (error) => observer.error(error),
  //       () => observer.complete()
  //     );
  //   });
  // }

  /**
   * Extracted mediaId from /media_object/xx with:
   *    let mediaId = Utils.extractIdFromIRI(mediaIRIString);
   * or (media: MediaModel):
   *    let mediaId = media.id; 
   */
  delete(mediaId: string|number): Observable<any> {
    return this.http.delete([API.UPLOADS, mediaId].join('/'));
  }

  /**
   * Method setting newly calculated data and notifying observers.
   * To be overridden by extended classes
   */
  // private setState(state: ProfileEducationsList = new ProfileEducationsList()) {
  //   let newState = Object.assign(new ProfileEducationsList(), state);
  //   this.state = newState;
  //   this.$stream.next(newState);
  //   return newState;
  // }

  // private setEducations(profile: string, response) {
  //   let _response = Object.assign({}, response);
  //   _response['hydra:member'] = [...response['hydra:member']]
  //     .map((education: IEducation) => new EducationModel(education));
  //   this.state.setProfileEducations(
  //      new ProfileEducationsModel(profile, _response['hydra:member'])
  //    );
  //   this.setState(this.state);
  //   return _response;
  // }

}
