import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {Http, RequestOptionsArgs, Headers, Response} from 'angular2/http';
import {ISignup, ISignupLD, SignupModel} from '../models/signup';
import {IProfileEditLD} from '../../profiles/models/profiles';
import {ISignin, SigninModel} from '../models/signin';
import {API} from '../../../config';
import {HttpProxy} from './http-proxy';
import {TOKEN, REFRESH_TOKEN} from '../../../constants';
import {AppService} from './app-service';
import {TokenManager, JwtTokenHelper} from './token-manager-service';

@Injectable()
export class Auth {
  headers: Headers = new Headers();
  jwtTokenHelper: JwtTokenHelper;

  constructor(
    public http: HttpProxy,
    private appSrv: AppService,
    private tokenManager: TokenManager
  ) {
    this.setHeaders();
    this.jwtTokenHelper = new JwtTokenHelper();
  }

  setHeaders() {
    this.headers.append('Content-Type', 'application/ld+json');
  }

  signup(signupModel: IProfileEditLD) : Observable<any>  {
    return this.http
      .post(API.SIGNUP, JSON.stringify(signupModel), { headers: this.headers });
  }

  signin(signinModel: ISignin) : Observable<any>  {
    let payload = new SigninModel(signinModel);
    // Server expects '_username=uroslates%40gmail.com&_password=password'
    let prepareBody = (json: any) => {
      return Object.keys(json).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
      }).join('&');
    };
    let URL = API.SIGNIN + '?Content-Type:application/x-www-form-urlencoded';
    // For signin Content-Type header is exception due to backend issues
    this.headers.set('Content-Type', 'application/x-www-form-urlencoded');
    return this.http
      .post(URL, prepareBody(payload.serialize()), { headers: this.headers });
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
    return this.http
      .post(URL, prepareBody(payload), { headers: this.headers });
  }

  signout() : Observable<any> {
    return Observable.create((observer) => {
        try {
          // this.tokenManager.invalidate();
          // this.appSrv.setToken(this.tokenManager.get());
          this.appSrv.signout();
          observer.next();
          observer.complete();
          
        } catch (e) {
          console.error('Signout: ', e);
          observer.error(e);
        }
    });
  }

  storeJwt(response: Response) {
    let jwt: string = response[TOKEN.key];
    let refreshJwt: string = response[REFRESH_TOKEN.key];
    this.tokenManager.set(jwt, refreshJwt);
  }

  get user() {
    let jwt: string = this.tokenManager.get();
    let decoded = this.jwtTokenHelper.decodeToken(jwt);
    return decoded.userId;
  }
}
