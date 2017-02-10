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
import {IJobPost, JobPostModel} from '../../models';
import {IMessage, MessageModel} from '../models';

@Injectable()
export class MessagesService {
  constructor(public http: HttpProxy) {}

  get(id: string): Observable<MessageModel> {
    let _observable = this.http.get([API.MESSAGES, id].join('/'));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(new MessageModel(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  query(query: any = {}): Observable<any> {
    var params = new URLSearchParams();
    Object.keys(query).forEach((key) => params.set(key, query[key]));
    let _observable = this.http.get(API.MESSAGES, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((message: IMessage) => new MessageModel(message));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  save(message: IMessage): Observable<MessageModel> {
    let _observable = this.http.post(API.MESSAGES, JSON.stringify(message));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(new MessageModel(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(message: IMessage): Observable<MessageModel> {
    let _observable = this.http.put(message['@id'], JSON.stringify(message));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(new MessageModel(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }
}
