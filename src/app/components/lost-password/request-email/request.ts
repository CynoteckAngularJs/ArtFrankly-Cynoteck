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
import {UrlValidators} from '../../../url/validators/validators';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {NotificationModel} from '../../notifications/notification/notification';
import {ROUTES, NOTIFICATION_TAGS} from '../../../constants';
import {Resetting} from '../services/resetting-service';

@Component({
    selector: 'request-email',
    directives: [ ...ROUTER_DIRECTIVES, NgClass],
    providers: [FormBuilder, Resetting],
    styles: [ require('./request.css') ],
    template: require('./request.html')
})
export class RequestEmail {
    form: ControlGroup;
    email: Control;
    showResetForm: boolean;

    constructor(
        private builder: FormBuilder,
        private router: Router,
        private routeParams: RouteParams,
        private location: Location,
        private resetting: Resetting,
        private notificationsSvc: NotificationsCollection
    ) {
        this.email = new Control(
            '',
            Validators.compose([Validators.required, UrlValidators.email])
        );
        this.form = builder.group({
            email: this.email
        });
        this.showResetForm = true;
    }

    sendEmail(email) {
        this.resetting.sendEmail(email).subscribe(
            (resp) => {
                this.notificationsSvc.removeByTag(NOTIFICATION_TAGS.UNAUTHORIZED);
                this.showResetForm = false;
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

