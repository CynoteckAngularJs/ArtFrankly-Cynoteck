import {Injectable, Injector} from 'angular2/core';
import {Router, ComponentInstruction, Location} from 'angular2/router';
import {TOKEN, REFRESH_TOKEN, ROUTES, REMEMBER_ME_ENABLED} from '../../../constants';
import {Observable} from 'rxjs/Observable';
import {appInjector} from '../../../appinjector';
import {HttpWrapper} from './http-proxy';
import {AppService} from './app-service';

// Avoid TS error "cannot find name escape"
declare var escape: any;

@Injectable()
export class TokenManager {

  get(): string {
    return localStorage.getItem(TOKEN.key);
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN.key);
  }

  getRememberMe() {
    return JSON.parse(localStorage.getItem(REMEMBER_ME_ENABLED.key) || false) ;
  }

  setRememberMe(isRememberMe: boolean) {
    localStorage.setItem(REMEMBER_ME_ENABLED.key, JSON.stringify(isRememberMe || false));
  }

  set(token: string, refreshToken: string): void {
    if (token) {
      localStorage.setItem(TOKEN.key, token);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN.key, refreshToken);
    }
  }

  invalidate() {
    localStorage.removeItem(TOKEN.key);
    localStorage.removeItem(REFRESH_TOKEN.key);
    localStorage.removeItem(REMEMBER_ME_ENABLED.key);
  }
}

/**
 * Helper class to decode and find JWT expiration.
 */
@Injectable()
export class JwtTokenHelper {
  public urlBase64Decode(str: string) {
    var output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0: { break; }
      case 2: { output += '=='; break; }
      case 3: { output += '='; break; }
      default: {
        throw 'Illegal base64url string!';
      }
    }
    //polifyll https://github.com/davidchambers/Base64.js
    return decodeURIComponent(escape(window.atob(output)));
  }

  public decodeToken(token: string) {
    var parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('JWT must have 3 parts');
    }
    var decoded = this.urlBase64Decode(parts[1]);
    if (!decoded) {
      throw new Error('Cannot decode the token');
    }
    return JSON.parse(decoded);
  }

  public getTokenExpirationDate(token: string) {
    var decoded: any;
    decoded = this.decodeToken(token);
    if (typeof decoded.exp === 'undefined') {
      return null;
    }
    var date = new Date(0); // The 0 here is the key, which sets the date to the epoch
    date.setUTCSeconds(decoded.exp);
    return date;
  }

  public isTokenExpired(token: string = '', offsetSeconds?: number) {
    if (!token) {
      return true;
    }
    var date = this.getTokenExpirationDate(token);
    offsetSeconds = offsetSeconds || 0;
    if (date === null) {
      return false;
    }
    // Token expired?
    return !(date.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
  }

  toString(token) {
    let isTokenValid;
    try {
       isTokenValid = this.isTokenExpired(token);
    } catch (e) {
      console.error('Token has expired! ', e);
      isTokenValid = false;
    }
    console.log('\n\n');
    console.log('Token: ', this.decodeToken(token));
    console.log('Expires on: ', this.getTokenExpirationDate(token));
    console.log('Is expired? ', this.isTokenExpired(token));
    console.log('\n\n');
  }
}

export function constructNonAuthorizedUrl(
  next?: ComponentInstruction, previous?: ComponentInstruction
): any[] {
  let injector: Injector = appInjector();
  let location: Location = injector.get(Location);
  let ref;
  if (next) {
    let refArr = [next.urlPath];
    if (next.urlParams && next.urlParams.length) {
      refArr.push(next.urlParams.join('&'));
    }
    ref = refArr.join('?');
  }
  let NON_AUTHORIZED_LINK_PARAMS: any[] = [
        ...ROUTES.NON_AUTHORIZED_ROUTE,
        { ref: ref || location.path() }
      ];
  return NON_AUTHORIZED_LINK_PARAMS;
}

export function checkIfHasPermission(next: ComponentInstruction, previous: ComponentInstruction) {
  let injector: Injector = appInjector();
  let router: Router = injector.get(Router);
  // let jwtTokenHelper = new JwtTokenHelper();
  // let tokenManager = new TokenManager();
  let jwtTokenHelper = injector.get(JwtTokenHelper);
  let tokenManager = injector.get(TokenManager);
  let httpWrapper = injector.get(HttpWrapper);
  // let appSrv = injector.get(AppService);
  let hasPermission;
  return new Promise((resolve, reject) => {
    let token, refreshToken, isRememberMe, isValidToken;
    try {
      // hasPermission =  !jwtTokenHelper.isTokenExpired(tokenManager.get());
      token = tokenManager.get();
      refreshToken = tokenManager.getRefreshToken();
      isRememberMe = tokenManager.getRememberMe();
      isValidToken = !jwtTokenHelper.isTokenExpired(token);
      // User has permission if he has token && remember me is true!
      hasPermission = (token && isValidToken) || (token && refreshToken && isRememberMe);
    } catch (e) {
      console.error('Error in token check ', e);
      reject(e);
    }
    // TODO: find a way arround below hack 
    // (timeout needed in order not to execute checkIfHasPermission 2 times)!
    setTimeout(() => {
      if (token && !isValidToken && refreshToken && isRememberMe) {
        // Try to refresh the token
        httpWrapper.refreshToken()
          .map(res => res.json())
          .subscribe(
            (response) => {
              console.log('\n\nREFRESH TOKEN ', response);
              // TODO: post token actions
              // this.storeJwt(response);
              tokenManager.set(response[TOKEN.key], response[REFRESH_TOKEN.key]);
              jwtTokenHelper.toString(response.token);
              // appSrv.setToken(response.token);
              resolve(true);
            },
            (error) => {
              console.error('\n\nREFRESH TOKEN ', error);
              router.navigate(constructNonAuthorizedUrl(next, previous));
              resolve(false);
            }
          );
      } else {
        hasPermission = token && isValidToken;
        // If all OK store tokena and containue!, else do below! 
        if (!hasPermission) {
            router.navigate(constructNonAuthorizedUrl(next, previous));
        }
        resolve(hasPermission);
      }
      // TODO: IF invalid token and isRememberMe && refreshToken - try to refresh token!
      // If all OK store tokena and containue!, else do below! 
      // if (!hasPermission) {
      //     router.navigate(constructNonAuthorizedUrl(next, previous));
      // }
      // resolve(hasPermission);
    });
  });
}
