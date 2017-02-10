import {Component, OnInit} from 'angular2/core';
import {RouteConfig, Router, ROUTER_DIRECTIVES} from 'angular2/router';
import {Modal, IModal} from '../modal/modal';
import {Utils} from '../../url/utils/index';

@Component({
  selector: 'af-footer',
  directives: [...ROUTER_DIRECTIVES, Modal],
  pipes: [],
  styles: [],
  template: require('./footer.html')
})
export class Footer implements OnInit {
  mobileModal: IModal = {
    title: 'Mobile',
    hideOnClose: true,
    closeable: false
  };
  name = 'Angular 2 Webpack Starter';
  url = 'https://twitter.com/AngularClass';
  constructor() {}

  ngOnInit() {
    if (Utils.isMobile().anyMobile()) {
      this.mobileModal.opened = true;
    }
  }

  onHide($event) {
    this.mobileModal.opened = false;
  }
}
