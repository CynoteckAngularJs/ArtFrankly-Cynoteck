import {Component, Input, Output, EventEmitter, OnInit} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {
  ROUTER_DIRECTIVES,
  Router,
  RouteParams,
  CanActivate
} from 'angular2/router';
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
import {SmarTextPipe, FormatDatePipe} from '../../../../../url/pipes/pipes';
import {Utils} from '../../../../../url/utils/index';
import {IMessage, MessageModel} from '../../messaging/models';

@Component({
  selector: 'reply-details',
  directives: [
    ...FORM_DIRECTIVES,
    ...ROUTER_DIRECTIVES,
    NgClass
  ],
  providers: [],
  pipes: [AsyncPipe, JsonPipe, SmarTextPipe, FormatDatePipe],
  styles: [require('../../messaging/list/messages.css')],
  template: require('./reply.html')
})


// @CanActivate(checkIfHasPermission)
export class ReplyDetails implements OnInit {
  @Input() reply: any;
  @Input() spacepost: any;
  @Input() noReply: boolean = false;

  constructor() {}

  ngOnInit() {}

  get _profile() {
    return this.reply &&
      (this.reply.hiringProfessional ||
      this.reply.hiringInstitution ||
      this.reply.hiringVendor || {});
  }

  get profileId() {
    let profile = this._profile;
    let id = profile && Utils.extractIdFromIRI(profile['@id']);
    return id;
  }

  get profileType() {
    let profile = this._profile;
    let id = profile && profile.type;
    return id;
  }
}


