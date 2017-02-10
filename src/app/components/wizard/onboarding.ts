import { Component, Input, ViewEncapsulation } from 'angular2/core';
import { ROUTER_DIRECTIVES, Router, RouteParams } from 'angular2/router';
import { FORM_DIRECTIVES, AsyncPipe, NgClass } from 'angular2/common';
import { Wizard } from './wizard';
import { Modal, IModal } from '../modal/modal';
import { steps } from '../../data/wizard';
import { ROUTES } from '../../constants';
import { ProfileEditLDModel } from '../profiles/models/profiles';
import { ProfilesService } from '../profiles/services/profiles-service';
import { AppService, ACTIONS, IApp, DEFAULTS } from '../authentication/services/app-service';
import { ProfileIdService } from '../projects/services/projects-service';
@Component({
  selector: 'signin',
  directives: [...ROUTER_DIRECTIVES, Modal, Wizard],
  providers: [],
  pipes: [AsyncPipe],
  styles: [require('./onboarding.css')],
  template: require('./onboarding.html'),
  encapsulation: ViewEncapsulation.None
})
export class Onboarding {
  modal: IModal = {
    title: 'Onboarding',
    closeable: false
  };
  @Input() profile: ProfileEditLDModel;
  state: IApp = DEFAULTS;
  steps: any = steps || [];
  selectedProfileId: string = '';
  profileType: string = '';
  userId: string = '';
  constructor(private router: Router,
    private routeParams: RouteParams,
    private profileService: ProfilesService,
    public ProfileIdService: ProfileIdService,
    private appSrv: AppService) {

    this.appSrv.$stream
      .subscribe((state) => {
        this.state = state;
        if (state.selectedProfile) {
          this.profileType = state.selectedProfile['@id'].split('/')[1];
          if (this.profileType == 'vendors' || this.profileType == 'institutions')
            this.selectedProfileId = state.selectedProfile['name'].trim().replace(/[^A-Za-z0-9]+/g, '-')
          else
            this.selectedProfileId = (state.selectedProfile['givenName'] + ' ' + state.selectedProfile['familyName']).trim().replace(/[^A-Za-z0-9]+/g, '-');
          this.profileType = state.selectedProfile['@id'].split('/')[1];
          this.userId = state.selectedProfile['@id'].split('/')[2];
          this.ProfileIdService.setProfileId(state.selectedProfile['@id']);
        }
      });

  }

  onFinished($event) {

    // this.router.parent.navigate(ROUTES.POST_SIGNIN_ROUTE);
    // this.router.parent.navigate(ROUTES.POST_SIGNUP_ONBOARD_ROUTE);
    this.router.navigate(['EditProfile', { 'type': this.profileType, '@id': this.selectedProfileId, 'uId': this.userId }]);
  }
}
