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
import {IFeedFilter, IFeed, FeedModel} from '../../feed/models';

@Injectable()
export class SearchService {
  constructor(public http: HttpProxy) {}

  _filterQueryToUrlParams(query: IFeedFilter = {}): URLSearchParams {
    let queries = Object.keys(query)
      .filter(key => query[key] && query[key].length)
      .map((key) => [key, query[key]].join('='));
    var params = new URLSearchParams(queries.join('&'));
    return params;
  }

  query(term: string = '', query: any = {}): Observable<any> {
    delete query.term;
    // let URL = [API.SEARCH, encodeURIComponent(term)].join('/');
    let URL_ARR = [API.SEARCH];
    if (term && term.trim() && term.trim().length) {
      URL_ARR.push(encodeURIComponent(term));
    }
    let URL = URL_ARR.join('/');
    let _observable = this.http.get(URL, { search: this._filterQueryToUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((feed: IFeed) => new FeedModel(feed));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  nextPage(nextPageUrl: string = ''): Observable<any> {
    let URL = API.BASE + nextPageUrl;
    let _observable = this.http.get(URL);

    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((feed: IFeed) => new FeedModel(feed));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }
}
