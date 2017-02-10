import {Component, Input, Output, EventEmitter} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {ROUTER_DIRECTIVES, Router, Location} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  JsonPipe,
  AsyncPipe
} from 'angular2/common';
import {Http} from 'angular2/http';
import {UrlValidators} from '../../../url/validators/validators';
import {Auth} from '../services/auth-service';
import {TokenManager, JwtTokenHelper} from '../services/token-manager-service';
import {AppService} from '../services/app-service';
import {ISignup} from '../models/signup';
import {ISignin} from '../models/signin';
import {ValuesPipe} from '../../../url/pipes/pipes';
import {
  IProfile,
  ProfileModel,
  IProfileEdit,
  ProfileEditModel,
  IProfileEditLD,
  IEditForm
} from '../../profiles/models/profiles';
import {
  Notification,
  NotificationModel,
  INotification
} from '../../notifications/notification/notification';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {Shared, SigninFormControlls} from '../shared';
import {
  PROFILE_TYPES,
  PROFILES,
  PROFILES_LONG,
  ROUTES,
  NOTIFICATION_TAGS
} from '../../../constants';
import {Select2} from '../../select/select';
import {Ng2Select2} from '../../../url/components/ng2select2/select2';

declare var fbq: any;

@Component({
  selector: 'signup',
  providers: [Auth],
  pipes: [AsyncPipe, ValuesPipe, JsonPipe],
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    Notification,
    Select2,
    Ng2Select2
  ],
  styles: [ require('./signup.css') ],
  template: require('./signup.html')
})
export class Signup {
  @Output() signedUp: EventEmitter<any> = new EventEmitter();
  profiles: any = PROFILES_LONG || [];
  profileTypes: any = PROFILE_TYPES;
  form: ControlGroup;
  generalGroup: ControlGroup;
  nonProfessionalGroup: ControlGroup;
  professionalGroup: ControlGroup;
  profileType: Control;
  email: Control;
  password: Control;
  givenName: Control;
  familyName: Control;
  name: Control;
	formInvalid$: Observable<boolean>;
  controlUpdateOptions: any = { onlySelf: true, emitEvent: true };
  profileTypeSelect2Options: any = {};
  isShowErrors: boolean = false;

  constructor(
    private builder: FormBuilder,
    private auth: Auth,
    private jwtTokenHelper: JwtTokenHelper,
    private tokenManager: TokenManager,
    private router: Router,
    private location: Location,
    public notificationsSrv: NotificationsCollection,
    public appSrv: AppService
  ) {
    this.initForm();
  }

  initForm() {
    this.email = new Control('', Shared.getEmailValidators());
    this.password = new Control('', Validators.compose([
          Validators.required, Validators.minLength
        ]));
    this.profileType = new Control(PROFILE_TYPES.professional, Validators.required);
    this.givenName = new Control('', Validators.required);
    this.familyName = new Control('', Validators.required);
    this.name = new Control('', Validators.required);
    this.nonProfessionalGroup = new ControlGroup({
      name: this.name
    });
    this.professionalGroup = new ControlGroup({
      givenName: this.givenName,
      familyName: this.familyName
    });
    this.generalGroup = new ControlGroup({
      email: this.email,
      password: this.password
    });
    this.form = this.builder.group({
      profileType: this.profileType,
      general: this.generalGroup,
      professional: this.professionalGroup,
      nonProfessional: this.nonProfessionalGroup
    });

    this.formInvalid$ = this.form.valueChanges
      .map(this.canSaveOrUpdate.bind(this))
      .map((formValid) => !formValid);
  }

  serializeForm(serializedForm: IEditForm): IProfileEditLD {
    let general = Object.assign({}, serializedForm.general);
    let isProfessional = serializedForm.profileType === PROFILE_TYPES.professional;
    return Object.assign({ profileType: serializedForm.profileType }, general,
      isProfessional ? serializedForm.professional : serializedForm.nonProfessional);
  }

  canSaveOrUpdate(values) {
    let profileType = values.profileType;
    let isProfileTypeValid = this.profileType.valid;
    let isGeneralValid = this.generalGroup.valid;
    let isProfessionalGroupValid = this.professionalGroup.valid;
    let isNonProfessionalGroupValid = this.nonProfessionalGroup.valid;
    let isFormValid = isProfileTypeValid && isGeneralValid;
    if (this.isProfessional(profileType)) {
      isFormValid = isFormValid && isProfessionalGroupValid;
    } else {
      isFormValid = isFormValid && isNonProfessionalGroupValid;
    }
    return isFormValid;
  }

  isProfessional(profileType: string): boolean {
    return profileType === PROFILE_TYPES.professional;
  }

  signup(serializedForm: IEditForm) {
    let signupModel: IProfileEditLD = this.serializeForm(serializedForm);
    this.auth.signup(signupModel)
      .subscribe(
        (resp) => {
          let isProfessional = this.isProfessional(signupModel.profileType);
          let name = isProfessional ? signupModel.givenName : signupModel.name;
          this.notificationsSrv.push(new NotificationModel({
                message: `<strong>Thank you ${name}</strong> for signing up!`,
                type: 'success',
                path: this.location.path()
              }));

// call send welcome email Api here

          this._signin({
            email: signupModel.email,
            password: signupModel.password
          });

          fbq('track', 'CompleteRegistration');
        },
        (error) => {
          console.error('Unknown error ', error);
        }
      );
  }

  _signin(credentials: ISignin) {
    this.auth.signin(credentials).subscribe(
      (resp) => {
          this.auth.storeJwt(resp);
          this.jwtTokenHelper.toString(resp.token);
          this.appSrv.setToken(resp.token);
          this.router.parent.navigate(ROUTES.POST_SIGNUP_ROUTE);
      }
    );
  }
}
