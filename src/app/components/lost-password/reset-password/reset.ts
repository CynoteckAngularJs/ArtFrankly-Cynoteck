import {Component} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location} from 'angular2/router';
import {
    FORM_DIRECTIVES,
    FormBuilder,
    Validators,
    Control,
    ControlGroup,
    NgClass,
    AbstractControl
} from 'angular2/common';
import {ROUTES, NOTIFICATION_TAGS} from '../../../constants';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {Resetting} from '../services/resetting-service';

@Component({
    selector: 'reset-password',
    directives: [ ...ROUTER_DIRECTIVES, NgClass],
    providers: [FormBuilder, Resetting],
    styles: [ require('./reset.css') ],
    template: require('./reset.html')
})
export class ResetPassword {
    resetForm: ControlGroup;
    password: AbstractControl;
    confirmPassword: AbstractControl;
    showResetForm: boolean;
    showPasswordChanged: boolean = false;
    showUrlIncorrect: boolean = false;
    urlError: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private routeParams: RouteParams,
        private resetting: Resetting,
        private notificationsSvc: NotificationsCollection,
        private location: Location
    ) {
        this.resetForm = formBuilder.group({
          'password': [
              '',
              Validators.compose(
                  [Validators.required, Validators.required]
              )
          ],
          'confirmPassword': ['', Validators.required]
        }, {validator: this.matchingPasswords('password', 'confirmPassword')});

        // 'confirmPassword': ['', Validators.required, this.isTooSimple]

        this.password = this.resetForm.controls['password'];
        this.confirmPassword = this.resetForm.controls['confirmPassword'];
    }

    ngOnInit() {
        this.checkToken();
    }

    /* tslint:disable */
    /**
     * In order for Validators to take parameters, they need to return a
     * function with either a ControlGroup or Control as a parameter.
     * @see http://stackoverflow.com/questions/31788681/angular2-validator-which-relies-on-multiple-form-fields#34582914
     */
    /* tslint:enable */
    matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
      return (group: ControlGroup): {[key: string]: any} => {
        let password = group.controls[passwordKey];
        let confirmPassword = group.controls[confirmPasswordKey];

        if (password.value !== confirmPassword.value) {
          return {
            mismatchedPasswords: true
          };
        }
      };
    }

    isTooSimple(control: Control): Promise<ValidationResult> {
        let result = new Promise((resolve, reject) => {
            // complexity: simple | complex
            this.resetting.verifyComplexity(this.password.value, 'simple').subscribe(
                (resp) => {
                    resolve({isTooSimple: true});
                },
                (error) => {
                    resolve({isTooSimple: false});
                }
            );
        });

        return result;
    }

    /**
     * Don't display form if token is invalid
     */
    checkToken() {
        let token = this.routeParams.get('token');

        this.resetting.verifyToken(token).subscribe(
            (resp) => {
                this.showResetForm = true;
            },
            (error) => {
                console.error(error);
                this.urlError = error;
                this.showResetForm = false;
                this.showUrlIncorrect = true;
            }
        );
    }

    resetPassword(password) {
        let token = this.routeParams.get('token');

        this.resetting.resetPassword(this.password.value, token).subscribe(
            (resp) => {
                this.notificationsSvc.removeByTag(NOTIFICATION_TAGS.UNAUTHORIZED);
                this.showResetForm = false;
                this.showPasswordChanged = true;
            },
            (error) => {
                console.error(error);

                this.notificationsSvc.push(new NotificationModel({
                    message: 'Error: ' + error,
                    type: 'danger',
                    tags: NOTIFICATION_TAGS.UNAUTHORIZED,
                    path: this.location.path()
                }));
            }
        );
    }
}

interface ValidationResult {
    [key: string]: boolean;
}

