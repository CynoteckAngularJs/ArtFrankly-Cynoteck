import {Injectable} from 'angular2/core';
import {
  Notification,
  NotificationModel,
  INotification
} from '../notification/notification';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/share';
import {ArrayUtils} from '../../../url/utils/index';

@Injectable()
export class NotificationsCollection {
  public $stream: Observable<NotificationModel[]>;
  private _observer: any;
  private _data: NotificationModel[] = [];

  constructor() {
    this.$stream = new Observable((observer) => {
        this._observer = observer;
      }).share();
  }

  concat(notifications: NotificationModel[]): NotificationModel[] {
    let data = [...this._data, ...notifications];
    return this._setData(data);
  }

  push(notification: NotificationModel): NotificationModel[] {
    let data = [...this._data, notification];
    if (notification.meta.isAutodestroyable) {
      setTimeout(() => {
          // destroy notification
          data = ArrayUtils.remove([...this._data], notification);
          this._setData(data);
      }, notification.meta.destroyTime);
    }
    return this._setData(data);
  }

  index(notification: NotificationModel): number {
    return this._data.indexOf(notification);
  }

  remove(notification: NotificationModel): NotificationModel {
    let index = this.index(notification);
    if (index >= 0) {
      let data = [...this._data];
      data.splice(index, 1);
      this._setData(data);
    }
    return notification;
  }

  removeByTag(tag: string) {
    let data = this.filterByTag(tag, false);
    return this._setData(data);
  }

  filterByTag(tag: string, haveTag: boolean = true): NotificationModel[] {
    let _withTag = (item: NotificationModel) : boolean => item.meta.tags.indexOf(tag) >= 0;
    let withTag = (item: NotificationModel): boolean => _withTag(item);
    let withOutTag = (item: NotificationModel): boolean => !_withTag(item);
    return this._data.filter(haveTag ? withTag : withOutTag);
  }

  /**
   * Function responsible for setting newly calculated data and notifying observers.
   */
  private _setData(data: any = []) {
    this._data = data;
    this._observer.next(data);
    return data;
  }
}
