import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {API} from '../../../config';
import {HttpProxy} from '../../authentication/services/http-proxy';
import {ISpacePost, SpacePostModel} from '../post/models';
import {SpacePostReplyModel, ISpacePostReply} from '../post/reply/models';

const DEFAULT_ADDRESS: any = {
      '@type': 'http://schema.org/Place',
      address: {
        '@type': 'http://schema.org/PostalAddress'
      }
    };

@Injectable()
export class SpacePostsService {
  constructor(public http: HttpProxy) {}

  get(id: string): Observable<SpacePostModel> {
    let _observable = this.http.get([API.SPACE_POSINGS, id].join('/'));
    console.log(API.SPACE_POSINGS);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(new SpacePostModel(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // /space_postings?hiringInstitution=2
  mySpacePosts(profileFieldType, profileFieldValue): Observable<SpacePostModel[]> {
    var params = new URLSearchParams();
    params.set(profileFieldType, profileFieldValue);
    let _observable = this.http.get(API.SPACE_POSINGS, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((spacepost: ISpacePost) => new SpacePostModel(spacepost));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // /space_postings?hiringInstitution=2
  myPublishedSpacePosts(profileFieldType, profileFieldValue): Observable<SpacePostModel[]> {
    var params = new URLSearchParams();
    params.set(profileFieldType, profileFieldValue);
    params.set('state', 'published');
    let _observable = this.http.get(API.SPACE_POSINGS, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((spacepost: ISpacePost) => new SpacePostModel(spacepost));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  mySpacePostsResponses(query: any = {}): Observable<SpacePostReplyModel[]>  {
    var params = new URLSearchParams();
    Object.keys(query).forEach((key) => params.set(key, query[key]));
    let _observable = this.http.get(API.SPACERESPONSES, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((spacepostreply: ISpacePostReply) => {
              spacepostreply.spacePosting = new SpacePostModel(spacepostreply.spacePosting);
              return new SpacePostReplyModel(spacepostreply);
            });
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  profileArchivedSpacePosts(profileIri: string) {
    // ?state=archived&profile=/professionals/2
    return this.query({
      state: 'archived',
      profile: profileIri
    });
  }

  query(query: any = {}) {
    var params = new URLSearchParams();
    Object.keys(query).forEach((key) => params.set(key, query[key]));
    let _observable = this.http.get(API.SPACE_POSINGS, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((spacepost: ISpacePost) => new SpacePostModel(spacepost));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  save(spacePost: ISpacePost = {}): Observable<SpacePostModel> {
    spacePost.spaceLocation = spacePost.spaceLocation  ||
      Object.assign({}, DEFAULT_ADDRESS);
    spacePost.contactLocation = spacePost.contactLocation  ||
      Object.assign({}, DEFAULT_ADDRESS);

    delete spacePost.id;
    delete spacePost['@id'];
    delete spacePost.contactLocation['@id'];
    delete spacePost.contactLocation.address['@id'];
    delete spacePost.spaceLocation['@id'];
    delete spacePost.spaceLocation.address['@id'];

    let _observable = this.http.post(API.SPACE_POSINGS, JSON.stringify(spacePost));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          observer.next(new SpacePostModel(response));
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(spacePost: ISpacePost = {}): Observable<SpacePostModel> {
    // spacePost.spaceLocation = spacePost.spaceLocation  || { address: {} };
    // spacePost.contactLocation = spacePost.contactLocation || { address: {} };
    let _observable = this.http.put(API.BASE + spacePost['@id'], JSON.stringify(spacePost));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          observer.next(new SpacePostModel(response));
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  archive(id: string) {
    let URL = [API.SPACE_POSINGS, id, 'archive'].join('/');
    return this.http.get(URL);
  }

  /* tslint:disable */
  /**
   * 1. POST /space_postings/{id}/checkout
   *  Response (approvalUrl: https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-08P56282NB734244H)
   * approvalUrl should be used for redirecting user to it (paypal form)
   */
  /* tslint:enable */
  checkout(id: string): Observable<{ approvalUrl: string }> {
    let URL = [API.SPACE_POSINGS, id, 'checkout'].join('/');
    return this.http.post(URL, '');
  }

  getLastPayment(spacePostId: string): Observable<{ approvalUrl: string }> {
    let URL = [API.SPACE_POSINGS, spacePostId, 'last_payment'].join('/');
    return this.http.get(URL);
  }

  execute(id: string) {
    let URL = [API.SPACE_POSINGS, id, 'execute'].join('/');
    return this.http.post(URL, '');
  }

  publish(id: string) {
    let URL = [API.SPACE_POSINGS, id, 'direct_publish'].join('/');
    return this.http.post(URL, '');
  }

}
