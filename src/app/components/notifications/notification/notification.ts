import {Component, Input, Output, EventEmitter} from 'angular2/core';
import {NgClass, JsonPipe} from 'angular2/common';
import {NotificationsCollection} from '../services/notifications';
import {GenericModel} from '../../../url/utils/index';

export interface INotification {
  message: string;
  type: string;
  tags?: string;
  path?: string;
  isAutodestroyable?: boolean;
  destroyTime?: number;
}

let defaults: INotification = {
  message: '',
  type: 'info',
  tags: '',
  isAutodestroyable: true,
  destroyTime: 4000
};

export class NotificationModel extends GenericModel {
  meta: INotification;

  constructor(notification: INotification) {
    super(notification);
    this.meta = Object.assign({}, defaults, notification);
  }
}

@Component({
  selector: 'notification',
  directives: [NgClass],
  providers: [],
  styles: [ require('./notification.css') ],
  template: require('./notification.html')
})
export class Notification {
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Input() notification: NotificationModel;

  constructor(public notificationsCollection: NotificationsCollection) {}

  closeNotification($event) {
    this.notificationsCollection.remove(this.notification);
    this.close.emit(this.notification);
  }
}
