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


@Injectable()
export class ChangePasswordService {
    constructor(public http: HttpProxy) {}

    update(password) : Observable<string> {
        return this.http.post(API.CHANGE_PASSWORD, JSON.stringify(password));
    }
}