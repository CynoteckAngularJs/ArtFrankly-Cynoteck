import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {Http, RequestOptionsArgs, Headers, Response} from 'angular2/http';
import {API} from '../../../config';
import {Utils, ArrayUtils} from '../../../url/utils/index';

@Injectable()
export class Resetting {
    constructor(public http: Http) {}

    verifyToken(token: string): Observable<any> {
        let verifyUrl = API.VERIFY_TOKEN + '/' + token;
        return this.http.get(verifyUrl)
              .map(res => res.json())
              .catch((error) => this._errorHandler(error));
    }

    resetPassword(password: string, token: string): Observable<any> {
        let body = JSON.stringify({ password: password });
        return this.http.post(API.RESET_PASSWORD + '/' + token, body)
              .map(res => res.json())
              .catch((error) => this._errorHandler(error));
    }

    sendEmail(email: string): Observable<any> {
        return this.http.post(API.REQUEST_RESET, JSON.stringify(email))
              .map(res => res.json())
              .catch((error) => this._errorHandler(error));
    }

    verifyComplexity(password: string, complexity: string): Observable<any> {
        let verifyUrl = API.VERIFY_COMPLEXITY + '/' + password + '/' + complexity;
        return this.http.get(verifyUrl)
              .map(res => res.json())
              .catch((error) => this._errorHandler(error));
    }

    private _errorHandler(error: any) {
        let errorMessage = 'Ups! Something went wrong. Please try again later!';

        if (error.status === 400 || error.status === 404) {
            errorMessage = error.json();
        }
        return Observable.throw(errorMessage);
    }
}
