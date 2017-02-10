import {Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass
} from 'angular2/common';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {FeedModel, IFeedFilter} from '../models';
import {FeedsService} from '../services/feeds-service';
import {FEED_TYPES, FEED_SORT_PARAM_VALUES, FEED_SORT_PARAM} from '../../../constants';

@Component({
  selector: 'feed-filter',
  directives: [...ROUTER_DIRECTIVES, NgClass],
  providers: [FeedsService],
  styles: [require('./filter.css')],
  template: require('./filter.html'),
  encapsulation: ViewEncapsulation.None
})
export class FeedFilter implements OnInit {
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Input() filter: IFeedFilter = {};
  @Input() total: number;
  FEED_TYPES: any = FEED_TYPES;
  FEED_SORT_PARAM_VALUES: any = FEED_SORT_PARAM_VALUES;
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  // Serialization of form values (due to custom sorting param and ...)
  serializedForm: Observable<IFeedFilter>;

  constructor(
    private router: Router,
    private location: Location,
    private routeParams: RouteParams,
    private builder: FormBuilder,
    private feedsService: FeedsService
  ) {
    this.initForm();
  }

  ngOnInit() { }

  getFilterValue(filter: IFeedFilter = {}) {
    let DEFAULTS: IFeedFilter = {
      type: FEED_TYPES.all,
    };
    return Object.assign(DEFAULTS, filter);
  }

  initForm() {
    let filter: IFeedFilter = this.getFilterValue(this.filter);
    this.form = this.builder.group({
      type: [filter.type],
      sort: [FEED_SORT_PARAM_VALUES.DESC],
    });
    this.serializedForm = this.form.valueChanges
      .map(this.serializeForm);
  }

  serializeForm(formValues) {
    let serializedForm = Object.assign({}, formValues);
    serializedForm[FEED_SORT_PARAM] = formValues.sort;
    delete serializedForm.sort;
    return serializedForm;
  }

  toggleType(value: string, $event) {
    $event.preventDefault();
    let newValue = this.form.controls['type'].value === value ? '' : value;
    (<Control>this.form.controls['type']).updateValue(newValue, this.controlUpdateOptions);
    this.change.next(this.form.value);
  }

  toggleSort($event) {
    $event.preventDefault();
    let sortValue = this.form.controls['sort'].value === FEED_SORT_PARAM_VALUES.DESC ?
      FEED_SORT_PARAM_VALUES.ASC : FEED_SORT_PARAM_VALUES.DESC;
    (<Control>this.form.controls['sort']).updateValue(sortValue, this.controlUpdateOptions);
  }

  triggerFilter(filter: IFeedFilter) {
    this.change.next(filter);
  }
}
