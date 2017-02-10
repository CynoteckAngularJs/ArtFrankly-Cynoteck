import {Component, OnInit} from 'angular2/core';
import {FORM_DIRECTIVES, JsonPipe} from 'angular2/common';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location} from 'angular2/router';
import {Subscription} from 'rxjs/Subscription';
import {AppService, IApp, ACTIONS} from '../components/authentication/services/app-service';
import {Title} from './providers/title';
import {Wizard} from '../components/wizard/wizard';
import {Step} from '../components/wizard/step/step';
import {Signup} from '../components/authentication/signup/signup';
import {Signin} from '../components/authentication/signin/signin';
import {Modal, IModal} from '../components/modal/modal';
import {sections} from '../data/sections';
import {steps} from '../data/wizard';
import {PROFILE_TYPES} from '../constants';
import {Ng2OwlCarousel} from '../url/components/ng2owlcarousel/ng2owlcarousel';
import {SlickCarousel} from '../url/components/slickcarousel/slickcarousel';

@Component({
  selector: 'home',  // <home></home>
  providers: [Title],
  directives: [
    ...FORM_DIRECTIVES,
    ROUTER_DIRECTIVES,
    Wizard,
    Signup,
    Signin,
    Modal,
    Step,
    Ng2OwlCarousel
  ],
  pipes: [JsonPipe],
  styles: [require('./home.css')],
  template: require('./home.html')
})

export class Home implements OnInit {
  steps: any = [];
  sections: any = [];
  state: IApp;
  state$: Subscription<[any]>;
  modal: IModal = {
    title: 'Test Modal'
  };
  PROFILE_TYPES: any = PROFILE_TYPES;

  constructor(public appSrv: AppService) {}

  ngOnInit() {
    this.steps = steps;
    this.sections = sections;
    this.state$ = this.appSrv.$stream
      .subscribe((state) => this.state = state);
  }

}
