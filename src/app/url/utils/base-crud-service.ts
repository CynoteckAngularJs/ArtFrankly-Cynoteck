import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {HttpProxy} from '../../components/authentication/services/http-proxy';

@Injectable()
export class BaseCRUDService {

  constructor(
    private modelClass: any,
    private ENDPOINT_BASE_URL: string,
    public http: HttpProxy
  ) {}

  _filterQueryToUrlParams(query: any = {}): URLSearchParams {
    let queries = Object.keys(query)
      .filter(key => query[key] && query[key].length)
      .map((key) => [key, query[key]].join('='));
    var params = new URLSearchParams(queries.join(', '));
    return params;
  }

  query(query?: any): Observable<any[]> {
    let _observable = this.http
      .get(this.ENDPOINT_BASE_URL, { search: this._filterQueryToUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((model: any) => new this.modelClass(model));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  get(id: string, query?: any): Observable<any> {
    let URL = [this.ENDPOINT_BASE_URL, id].join('/');
    let _observable = this.http.get(URL, { search: this._filterQueryToUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let model = new this.modelClass(response);
          observer.next(model);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  save(model: any): Observable<any> {
    let _observable = this.http.post(this.ENDPOINT_BASE_URL, JSON.stringify(model));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let model = new this.modelClass(response);
          observer.next(model);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(model: any): Observable<any> {
    let _observable = this.http.post(model['@id'], JSON.stringify(model));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let model = new this.modelClass(response);
          observer.next(model);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  delete(model: any): Observable<any> {
    return this.http.delete(model['@id']);
  }
}
