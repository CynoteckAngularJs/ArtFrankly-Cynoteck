import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {API} from '../../../../../config';
import {HttpProxy} from '../../../../authentication/services/http-proxy';
import {ISpacePostReply, SpacePostReplyModel} from '../models';

@Injectable()
export class SpacePostReplyService {
  constructor(public http: HttpProxy) {}

  get(id: string): Observable<SpacePostReplyModel> {
    let _observable = this.http.get([API.SPACEPOST_RESPONSES, id].join('/'));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(new SpacePostReplyModel(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  save(spacePost: ISpacePostReply): Observable<SpacePostReplyModel> {
    return this.http.post(API.SPACEPOST_RESPONSES, JSON.stringify(spacePost));
  }

  update(spacePost: ISpacePostReply): Observable<ISpacePostReply> {
    return this.http.put(API.BASE + spacePost['@id'], JSON.stringify(spacePost));
  }
}
