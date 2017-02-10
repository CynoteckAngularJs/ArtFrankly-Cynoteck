import { Injectable } from 'angular2/core';
import { Observable } from 'rxjs/Observable';
import { Http, RequestOptionsArgs, RequestOptions, Headers, Response } from 'angular2/http';
import { NotificationsCollection } from '../../notifications/services/notifications';
import { NotificationModel } from '../../notifications/notification/notification';
import { Router, Location } from 'angular2/router';
import {
  TokenManager,
  constructNonAuthorizedUrl,
  JwtTokenHelper
} from './token-manager-service';
import { ROUTES, NOTIFICATION_TAGS, REFRESH_TOKEN, TOKEN } from '../../../constants';
import { AppService } from './app-service';
import { API } from '../../../config';

@Injectable()
export class HttpWrapper {
  headers: Headers;

  constructor(
    private http: Http,
    public notifications: NotificationsCollection,
    private router: Router,
    private location: Location,
    private tokenManager: TokenManager
  ) {
    this.headers = this.getHeaders();
  }

  getHeaders(): Headers {
    let token = this.tokenManager.get();
    let headers = new Headers();
    headers.set('Content-Type', 'application/ld+json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  _mergeOptions(options: RequestOptionsArgs = {}): RequestOptionsArgs {
    let defaultOptions = new RequestOptions({ headers: this.getHeaders() });
    return defaultOptions.merge(options);
  }

  get(url: string, options?: RequestOptionsArgs): Observable<any> {
    let mergedOptions = this._mergeOptions(options);
    return this.http.get(url, mergedOptions);
  }

  post(url: string, body: string, options?: RequestOptionsArgs): Observable<any> {
    let mergedOptions = this._mergeOptions(options);
    return this.http.post(url, body, mergedOptions);
  }

  put(url: string, body: string, options?: RequestOptionsArgs): Observable<any> {
    let mergedOptions = this._mergeOptions(options);
    return this.http.put(url, body, mergedOptions);
  }

  delete(url: string, options?: RequestOptionsArgs): Observable<any> {
    let mergedOptions = this._mergeOptions(options);
    return this.http.delete(url, mergedOptions);
  }

  refreshToken() {
    let payload = {};
    payload[REFRESH_TOKEN.key] = this.tokenManager.getRefreshToken();
    // Server expects '_username=uroslates%40gmail.com&_password=password'
    let prepareBody = (json: any) => {
      return Object.keys(json).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
      }).join('&');
    };
    let URL = API.REFRESH_TOKEN + '?Content-Type:application/x-www-form-urlencoded';
    // For signin Content-Type header is exception due to backend issues
    this.headers.set('Content-Type', 'application/x-www-form-urlencoded');
    return this.http.post(URL, prepareBody(payload), { headers: this.headers });
  }
}

// TODO: Custom AuthHttp service W all required headers set and extraction of jwt
@Injectable()
export class HttpProxy {
  // headers: Headers;
  jwtTokenHelper: JwtTokenHelper;
  lastAttemptedApiCall: any;
  lastForbidenApiCall: any;

  constructor(
    // private http: Http,
    private http: HttpWrapper,
    public notifications: NotificationsCollection,
    private router: Router,
    private location: Location,
    private tokenManager: TokenManager,
    private appSrv: AppService
  ) {
    // this.headers = this.getHeaders();
    this.jwtTokenHelper = new JwtTokenHelper();
  }

  // getHeaders(): Headers {
  //   let token = this.tokenManager.get();
  //   let headers = new Headers();
  //   headers.set('Content-Type', 'application/ld+json');
  //   if (token) {
  //     headers.set('Authorization', `Bearer ${token}`);
  //   }
  //   return headers;
  // }

  // _mergeOptions(options: RequestOptionsArgs = {}): RequestOptionsArgs {
  //   let defaultOptions = new RequestOptions({ headers: this.getHeaders() });
  //   return defaultOptions.merge(options);
  // }

  // Handler taking error and returns observable
  // If 401 & there is valid refresh token tries to refresh the token by doing API call
  // refreshTokenAwareErrorHandler(error: any = {}): Observable<any> {
  //   return Observable.create((observer) => {
  //     // Cover token refresh case
  //     let signinInstruction = this.router.generate(['./Signin']);
  //     let isSignin = this.location.path().startsWith('/' + signinInstruction.urlPath);
  //     let refreshToken = this.tokenManager.getRefreshToken();
  //     let isValidToken;
  //     try {
  //       isValidToken = !this.jwtTokenHelper.isTokenExpired(refreshToken);
  //       if (error.status === 401 && !isSignin && refreshToken && isValidToken) {
  //         // Handle refresh token if needed!
  //         this.http.refreshToken().subscribe(
  //           (response) => this.onTokenRefreshed(response),
  //           (error) => observer.error(error),
  //           () => observer.complete()
  //         );
  //       } else {
  //         observer.error(error);
  //       }
  //     } catch(e) {
  //       console.error('Invalid token! ', e);
  //       observer.error('Invalid refresht token');
  //     }
  //   });
  // }

  proxy(method: string, methodArgs): Observable<any> {
    let self = this;
    this.setLastAttemptedApiCall(method, methodArgs);
    return Observable.create((observer) => {
      this.http[method].apply(this.http, methodArgs)
        .subscribe(
        (response) => {
          observer.next(response);
        },
        (error) => {
          // Cover token refresh case
          let signinInstruction = this.router.generate(['./Signin']);
          let isSignin = this.location.path().startsWith('/' + signinInstruction.urlPath);
          let refreshToken = this.tokenManager.getRefreshToken();
          let isValidToken = refreshToken && refreshToken.length;
          try {
            //  isValidToken = !this.jwtTokenHelper.isTokenExpired(refreshToken);
            if (error.status === 401 && !isSignin && refreshToken && isValidToken) {
              this.setLastForbidenApiCall(method, methodArgs);
              // Handle refresh token if needed!
              if (this.tokenManager.getRememberMe()) {
                this.http.refreshToken()
                  .map(res => res.json())
                  .subscribe(
                  (response) => {
                    this.onTokenRefreshed(response).subscribe(
                      (response) => {
                        observer.next(response);
                      },
                      (error) => observer.next(error),
                      () => observer.complete()
                    );
                  },
                  (error) => observer.error(error),
                  () => observer.complete()
                  );
              } else {
                observer.error(error);
              }
            } else {
              observer.error(error);
            }
          } catch (e) {
            console.error('Invalid token! ', e);
            observer.error(error);
          }
        },
        () => observer.complete()
        );
    });
  }

  get(url: string, options?: RequestOptionsArgs): Observable<any> {
    // this.setLastAttemptedApiCall('get', arguments);
    // let mergedOptions = this._mergeOptions(options);
    // return this.http.get(url, mergedOptions)
    return this.proxy('get', arguments)
      // return this.http.get(url, options)
      .map(res => res.json())
      .catch((error) => this._errorHandler(error));
  }

  post(url: string, body: string, options?: RequestOptionsArgs): Observable<any> {
    // this.setLastAttemptedApiCall('post', arguments);
    // let mergedOptions = this._mergeOptions(options);
    // return this.http.post(url, body, mergedOptions)
    return this.proxy('post', arguments)
      // return this.http.post(url, body, options)
      .map((res) => res.json())
      .catch((error) => this._errorHandler(error));
  }

  put(url: string, body: string, options?: RequestOptionsArgs): Observable<any> {
    // this.setLastAttemptedApiCall('put', arguments);
    // let mergedOptions = this._mergeOptions(options);
    // return this.http.put(url, body, mergedOptions)
    return this.proxy('put', arguments)
      // return this.http.put(url, body, options)
      .map(res => res.json())
      .catch((error) => this._errorHandler(error));
  }

  delete(url: string, options?: RequestOptionsArgs): Observable<any> {
    // this.setLastAttemptedApiCall('delete', arguments);
    // let mergedOptions = this._mergeOptions(options);
    // return this.http.delete(url, mergedOptions)
    return this.proxy('delete', arguments)
      // return this.http.delete(url, options)
      .map(res => {
        // By default return raw response
        let response = res;
        try {
          response = res.json();
        } catch (e) {
          console.error('Error parsing response ', e);
        }
        return response;
      })
      .catch((error) => this._errorHandler(error));
  }

  private _errorHandler(error: Response) {
    let signinInstruction = this.router.generate(['./Signin']);
    let isSignin = this.location.path().startsWith('/' + signinInstruction.urlPath);
    console.error('POST ', error, this.notifications);
    if (error.status === 500 && error.json()['hydra:description'].indexOf('Integrity constraint violation') < 0) {
      this.notifications.push(new NotificationModel({
        message: 'We encountered an error. Please reload the page!',
        type: 'danger',
        path: this.location.path()
      }));
    } else if (error.status === 400) {
      let errorBody = error.json();
      errorBody.violations.map((sError) => this.notifications.push(new NotificationModel({
        message: sError.message,
        type: 'danger',
        path: this.location.path()
      })));
    } else if (error.status === 401 && !isSignin) {
      // TODO: comment this out
      // this.handleUnauthorized();
      // TODO: uncomment this out
      this.nonAuthorizedHandler();
    } else if (error.status === 403) {
      this.notifications.push(new NotificationModel({
        message: 'You do not have a permission for performing this action!',
        type: 'warning',
        tags: NOTIFICATION_TAGS.UNAUTHORIZED,
        path: this.location.path()
      }));
    }
    return Observable.throw(error);
  }

  private handleUnauthorized() {
    if (this.tokenManager.getRefreshToken()) {
      this.http.refreshToken().subscribe(
        (response) => this.onTokenRefreshed(response),
        (error) => this.nonAuthorizedHandler()
      );
    } else {
      this.nonAuthorizedHandler();
    }
  }

  private onTokenRefreshed(response): Observable<any> {
    this.storeJwt(response);
    this.jwtTokenHelper.toString(response.token);
    this.appSrv.setToken(response.token);
    return this.retryApiCall(this.lastForbidenApiCall);
    // this.notifySuccess(credentials);
    // this.redirect(this.routeParams.get('ref'));
  }

  private storeJwt(response: Response) {
    let jwt: string = response[TOKEN.key];
    let refreshJwt: string = response[REFRESH_TOKEN.key];
    this.tokenManager.set(jwt, refreshJwt);
  }

  private nonAuthorizedHandler() {
    this.notifications.push(new NotificationModel({
      message: 'You are not authorized to perform this action!',
      type: 'warning',
      tags: NOTIFICATION_TAGS.UNAUTHORIZED,
      path: this.location.path()
    }));
    this.router.navigate(constructNonAuthorizedUrl());
  }

  private setLastAttemptedApiCall(method: string, args: IArguments) {
    this.lastAttemptedApiCall = {
      method: method,
      args: args
    };
  }

  private setLastForbidenApiCall(method: string, args: IArguments) {
    this.lastForbidenApiCall = {
      method: method,
      args: args
    };
  }

  // private retryLastAttemtedApiCall(): Observable<any> {
  //   console.log('retryLastAttemtedApiCall ', this);
  //   let lastAttempted = Object.assign({}, this.lastAttemptedApiCall);
  //   return this[lastAttempted.method].apply(this, lastAttempted.args);
  // }

  private retryApiCall(recordedApiCall: any): Observable<any> {
    console.log('retryApiCall ', recordedApiCall);
    let apiCallToRetry = Object.assign({}, recordedApiCall);
    return this[apiCallToRetry.method].apply(this, apiCallToRetry.args);
  }
}
