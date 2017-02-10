import {Component} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, Location, CanActivate} from 'angular2/router';
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
import {checkIfHasPermission} from '../../authentication/services/token-manager-service';
import {ChangePasswordService} from '../services/change-password-service';

@Component({
    selector: 'change-password',
    directives: [ ...ROUTER_DIRECTIVES, NgClass],
    providers: [FormBuilder, ChangePasswordService],
    styles: [ require('./change.css') ],
    template: require('./change.html')
})
@CanActivate(checkIfHasPermission)
export class ChangePassword {
    changeForm: ControlGroup;
    password: AbstractControl;
    confirmPassword: AbstractControl;
    showChangeForm: boolean = true;
    showPasswordChanged: boolean = false;
    showUrlIncorrect: boolean = false;
    urlError: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private notificationsSvc: NotificationsCollection,
        private location: Location,
        private router: Router,
        private passwordService: ChangePasswordService
    ) {
        this.changeForm = formBuilder.group({
            'password': [
                '',
                Validators.compose(
                    [Validators.required, Validators.required]
                )
            ],
            'confirmPassword': ['', Validators.required]
        }, {validator: this.matchingPasswords('password', 'confirmPassword')});

        this.password = this.changeForm.controls['password'];
        this.confirmPassword = this.changeForm.controls['confirmPassword'];
    }

    ngOnInit() {
        this.showChangeForm = true;
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

    changePassword(password) {
        this.passwordService.update(password).subscribe(
            (resp) => {
                this.notificationsSvc.removeByTag(NOTIFICATION_TAGS.UNAUTHORIZED);

                this.notificationsSvc.push(new NotificationModel({
                    message: `Password has been changed!`,
                    type: 'success',
                    path: this.location.path()
                }));
                this.router.navigate(['/Feeds']);
            },
            (error) => {
                this.notificationsSvc.push(new NotificationModel({
                    message: `Error changing password!` + error,
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

