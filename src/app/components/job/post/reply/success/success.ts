import {Observable} from 'rxjs/Observable';
import {Component, Input, Output, ViewEncapsulation, OnInit, ViewChild} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {Subscription} from 'rxjs/Subscription';
import {Modal, IModal} from '../../../../modal/modal';
import {IJobPost} from '../../models';

@Component({
  selector: 'jobpost-reply-success-modal',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    Modal
  ],
  pipes: [AsyncPipe],
  styles: [ require('./success.css') ],
  template: require('./success.html'),
  encapsulation: ViewEncapsulation.None
})
export class JobPostReplySuccess implements OnInit {
  @Input() modal: IModal = {
    title: 'Send a reply to job post',
    hideOnClose: true,
  };
  @Input() jobpost: IJobPost;

  ngOnInit() {}

  onClose($event) {
    console.log('onClose: ', $event);
  }

  onHide($event) {
    console.log('onHide($event) ', $event);
  }
}
