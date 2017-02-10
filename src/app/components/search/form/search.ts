import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {
  Component,
  ViewEncapsulation,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter
} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
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
import {ROUTES, PAYMENT_SHARE_PARAM} from '../../../constants';
import {NotificationsCollection} from '../../notifications/services/notifications';
import {
  Notification,
  NotificationModel
} from '../../notifications/notification/notification';
import {Modal, IModal} from '../../modal/modal';
import {Utils} from '../../../url/utils/index';
import {SearchService} from '../services/search-service';
import {IFeed, FeedModel} from '../../feed/models';

declare var fbq: any;

interface ISuggestion {
  term?: string;
  suffix?: string;
  suggestions?: string[];
}

@Component({
  selector: 'search-form',
  directives: [...ROUTER_DIRECTIVES, Notification],
  providers: [SearchService],
  pipes: [AsyncPipe, JsonPipe],
  styles: [ require('./search.css') ],
  template: require('./search.html'),
  encapsulation: ViewEncapsulation.None
})
export class SearchForm implements OnInit, OnChanges, OnDestroy {
  notifications: Observable<NotificationModel[]>;
  @Input() term: string;
  @Input() isShowSuggestionsList: boolean = true;
  @Input() isShowSuggestions: boolean = true;
  @Input() isShowSearchButton: boolean = true;
  @Input() isShowTermsName: boolean = false;
  @Input() placeholder: string = '';
  @Output() onresultserror: EventEmitter<any> = new EventEmitter();
  @Output() onresultssuccess: EventEmitter<any> = new EventEmitter();
  @Output() onenter: EventEmitter<any> = new EventEmitter();
  @Output() changeterm: EventEmitter<any> = new EventEmitter();
  form: ControlGroup;
  isShowErrors: boolean = false;
  searchTerms$: Subscription<any>;
  results: any[] = [];
  suggestion: ISuggestion;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };

  constructor(
    private builder: FormBuilder,
    private router: Router,
    public notificationsSrv: NotificationsCollection,
    public searchService: SearchService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.notifications = this.notificationsSrv.$stream;
  }

  ngOnChanges(changes) {
    (<Control>this.form.controls['term'])
      .updateValue(this.term, this.controlUpdateOptions);
  }

  ngOnDestroy() {
    if (this.searchTerms$) {
      this.searchTerms$.unsubscribe();
    }
  }

  initForm() {
    this.form = this.builder.group({
      term: [this.term || '']
		});

    this.searchTerms$ = this.form.valueChanges
      .map((changes) => {
        this.suggestion = null;
        return changes;
      })
      .debounceTime(300)
      .distinctUntilChanged()
      .filter((changes: any) => changes.term && changes.term.length)
      .flatMap((changes: any) => this.searchService.query(changes.term))
      .subscribe(
        (response: any) => this.onResults(response),
        (error: any) => this.onError(error)
      );
  }

  onResults(response: any) {
    let term = (<Control>this.form.controls['term']).value;
    this.results = response['hydra:member'];
    this.onresultssuccess.next({
      term: term,
      results: response
    });
    this.suggestion = this.getSuggestion(term);

    fbq('track', 'Search');
  }

  onError(error) {
    let term = (<Control>this.form.controls['term']).value;
    this.onresultserror.next({
      term: term,
      error: error
    });
    this.notificationsSrv.push(new NotificationModel({
        message: `Error while executing search! Please try again.`,
        type: 'danger'
      }));
  }

  getSuggestion(term: string = ''): ISuggestion {
    let suggestion: string;
    let suggestions = this.results
      .map((suggestion) => suggestion.name)
      .filter((name) => name.length)
      .filter((name) => name.toLowerCase().startsWith(term.toLowerCase()));
    return suggestions.length ? {
        term: term,
        // suffix: suggestions[0].replace(term, ''),
        suffix: suggestions[0].substring(term.length, suggestions[0].length),
        suggestions: suggestions
      } : null;
  }

  onEnter($event) {
    $event.preventDefault();
    let term = this.form.value.term;
    console.log($event);
    this.onenter.next({ term: term });
  }

  onHide($event, term) {
    $event.preventDefault();
    this.onenter.next({ term: term });
  }

  onKeyup($event) {
    this.changeterm.next((<Control>this.form.controls['term']).value);
  }
}
