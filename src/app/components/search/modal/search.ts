import {Observable} from 'rxjs/Observable';
import {
  Component,
  ViewEncapsulation,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter
} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {FORM_DIRECTIVES, AsyncPipe, NgClass} from 'angular2/common';
import {ROUTES, PAYMENT_SHARE_PARAM} from '../../../constants';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../notifications/notification/notification';
import {Modal, IModal} from '../../modal/modal';
import {Utils} from '../../../url/utils/index';
import {SearchForm} from '../form/search';

declare var jQuery: any;

@Component({
  selector: 'search-modal',
  directives: [...ROUTER_DIRECTIVES, Notification, Modal, SearchForm],
  providers: [],
  pipes: [AsyncPipe],
  // styles: [ require('./paypal.css') ],
  template: require('./search.html'),
  encapsulation: ViewEncapsulation.None
})
export class SearchModal implements OnInit, OnChanges {
  notifications: Observable<NotificationModel[]>;
  term: string;
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Input() modal: IModal = {
    title: 'Search',
    hideOnClose: true,
  };

  constructor(
    private router: Router,
    // private routeParams: RouteParams,
    public notificationsSrv: NotificationsCollection
  ) {
    // this.getSearchTerm();
  }

  ngOnInit() {
    this.notifications = this.notificationsSrv.$stream;
  }

  ngOnChanges(changes) {
    console.log('changes: ', changes);
    if (changes.modal.currentValue) {
      if (changes.modal.currentValue.opened) {
        setTimeout(function() {
          jQuery('input#termInput').focus();
        }, 100);
      }
    }
  }

  // getSearchTerm() {
  //   this.term = this.routeParams.get('term');
  //   return this.term;
  // }

  onClose($event) {
    this.close.next($event);
  }

  onHide($event?) {
    this.modal.opened = false;
  }

  onEnter(term: { term?: string } = {}) {
    if (term.term) {
      this.router.navigate(['./Feeds', { term: term.term }]);
    }
    this.onHide();
  }
}
