import {Observable} from 'rxjs/Observable';
import {Component, Input, Output, ViewEncapsulation, OnInit, ViewChild} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, JsonPipe, NgClass} from 'angular2/common';
import {Subscription} from 'rxjs/Subscription';
import {IMessage, MessageModel} from '../models';
import {
  FormatDatePipe,
  FileSizePipe,
  SmarTextPipe
} from '../../../../../url/pipes/pipes';

@Component({
  selector: 'af-message',
  directives: [
    ...FORM_DIRECTIVES,
    ...ROUTER_DIRECTIVES,
    NgClass,
    MessageDetails
  ],
  pipes: [JsonPipe, AsyncPipe, FormatDatePipe, FileSizePipe, SmarTextPipe],
  styles: [ require('./message.css') ],
  template: require('./message.html'),
  encapsulation: ViewEncapsulation.None
})
export class MessageDetails implements OnInit {
  @Input() message: MessageModel;
  @Input() profile: string;
  @Input() removeableAttachments: boolean = false;

  ngOnInit() {}
}
