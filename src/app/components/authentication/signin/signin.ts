import {Component, Input, Output, EventEmitter} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass
} from 'angular2/common';
import {Auth} from '../services/auth-service';
import {UrlValidators} from '../../../url/validators/validators';
import {ISignin} from '../models/signin';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {Shared, SigninFormControlls} from '../shared';
import {TokenManager, JwtTokenHelper} from '../services/token-manager-service';
import {AppService} from '../services/app-service';
import {ROUTES, NOTIFICATION_TAGS} from '../../../constants';
import {SpacePostStorage} from '../../spaces/post/models';
import {JobPostStorage} from '../../job/post/models';

@Component({
  selector: 'signin',
  directives: [ ...ROUTER_DIRECTIVES, NgClass],
  providers: [FormBuilder, Auth, JwtTokenHelper],
  styles: [ require('./signin.css') ],
  template: require('./signin.html')
})
export class Signin {
  @Output() signedIn: EventEmitter<any> = new EventEmitter();
  form: ControlGroup;
	email: Control;
	password: Control;

  constructor(
      private builder: FormBuilder,
      private auth: Auth,
      private router: Router,
      private routeParams: RouteParams,
      private location: Location,
      private notificationsSvc: NotificationsCollection,
      private tokenManager: TokenManager,
      private jwtTokenHelper: JwtTokenHelper,
      public appSrv: AppService
  ) {
    let signinCoontrolls: SigninFormControlls = Shared.getSigninFormControlls();
    this.email = signinCoontrolls.email;
    this.password = signinCoontrolls.password;
    this.form = builder.group({
			email: this.email,
      password: this.password,
      rememberMe: this.tokenManager.getRememberMe()
		});
  }

  signin(credentials: ISignin) {
    let isRememberMe: boolean = this.form.controls['rememberMe'].value;
    this.tokenManager.setRememberMe(isRememberMe);
    this.auth.signin(credentials).subscribe(
      (resp) => {
        this.auth.storeJwt(resp);
        this.jwtTokenHelper.toString(resp.token);
        this.appSrv.setToken(resp.token);
        this.notifySuccess(credentials);
        SpacePostStorage.invalidate();
        JobPostStorage.invalidate();
        this.redirect(this.routeParams.get('ref'));
      },
      (error) => {
        if (error.status === 401) {
          this.notificationsSvc.push(new NotificationModel({
            message: `Username or password not valid!`,
            type: 'danger',
            tags: NOTIFICATION_TAGS.UNAUTHORIZED,
            path: this.location.path()
          }));
        }
      }
    );
  }

  private redirect (redirectUrl?: string) {
    if (redirectUrl) {
      this.router.parent.navigateByUrl(redirectUrl);
    } else {
      this.router.parent.navigate(ROUTES.POST_SIGNIN_ROUTE);
    }
  }

  private notifySuccess(credentials: ISignin) {
    /* tslint:disable */
    let message = `<span class="af-icon icon-settings af-icon-l"></span> <strong>Welcome back, ${credentials.email}</strong>`;
    /* tslint:enable */
    this.notificationsSvc.push(new NotificationModel({
        message: message,
        type: 'info',
        path: this.location.path()
      }));
    this.notificationsSvc.removeByTag(NOTIFICATION_TAGS.UNAUTHORIZED);
  }
}
