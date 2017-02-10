import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  ViewEncapsulation
} from 'angular2/core';
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
import {FeedsService} from '../../../services/feeds-service';
import {FeedModel, IFeedFilter} from '../../../models';
import {
  FEED_TYPES,
  FEED_SORT_PARAM_VALUES,
  FEED_SORT_PARAM,
  FILTER_TYPES,
  JOB_POSITION_TYPES,
  JOB_SERVICES
} from '../../../../../constants';
import {Ng2Select2} from '../../../../../url/components/ng2select2/select2';
import {SearchForm} from '../../../../search/form/search';
import {NotificationsCollection} from '../../../../notifications/services/notifications';
import {NotificationModel} from '../../../../notifications/notification/notification';

@Component({
  selector: 'jobs-filter',
  directives: [...ROUTER_DIRECTIVES, ...FORM_DIRECTIVES, NgClass, Ng2Select2, SearchForm],
  providers: [FeedsService],
  styles: [ require('../filter.css') ],
  template: require('./filter.html'),
  encapsulation: ViewEncapsulation.None
})
export class JobsFilter implements OnInit, OnChanges {
  @Input() term: string;
  @Input() jobPositionTypes: string;
  @Input() jobServices: string;
  @Input() cities: string;
  @Input() radius: string;
  @Output() filterchange: EventEmitter<any> = new EventEmitter();
  FILTER_TYPES: any = FILTER_TYPES;
  JOB_POSITION_TYPES: any = JOB_POSITION_TYPES;
  JOB_SERVICES: any = JOB_SERVICES;
  RADIUSES: any = [];
  selectedType: string;
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  select2Options: any = {
    placeholder: 'Select specific cities',
    // tags: true
  };
  radiusSelect2Options: any = {
    placeholder: 'Radius (MI)'
  };

  constructor(
      private router: Router,
      private location: Location,
      private notificationsSvc: NotificationsCollection,
      private routeParams: RouteParams,
      private builder: FormBuilder,
      private feedsService: FeedsService
  ) {
    this.initForm();
  }

  ngOnInit() {
    // this.router.navigate(['/Feeds']);
  }

  ngOnChanges(changes) {
    this.updateForm();
  }

  initForm() {
    // let filter: IFeedFilter = this.getFilterValue(this.filter);
    this.form = this.builder.group({
      type: [FEED_TYPES.job_posting],
      // sort: [FEED_SORT_PARAM_VALUES.DESC],
      term: [this.term || ''],
      jobPositionTypes: [this.jobPositionTypes || ''],
      jobServices: [this.jobServices || ''],
      cities: [this.cities || ''],
      radius: [this.radius || '']
		});
    // this.serializedForm = this.form.valueChanges
    //   .map(this.serializeForm);
  }

  updateForm() {
    (<Control>this.form.controls['term'])
      .updateValue(this.term, this.controlUpdateOptions);
    (<Control>this.form.controls['jobPositionTypes'])
      .updateValue(this.jobPositionTypes, this.controlUpdateOptions);
    (<Control>this.form.controls['jobServices'])
      .updateValue(this.jobServices, this.controlUpdateOptions);
    (<Control>this.form.controls['cities'])
      .updateValue(this.cities, this.controlUpdateOptions);
    (<Control>this.form.controls['radius'])
      .updateValue(this.radius, this.controlUpdateOptions);
  }

  triggerFilter(filter: IFeedFilter) {
    this.filterchange.next(this.serialize(filter));
  }

  isChecked(jobPositionTypes: string = '', positionType: string) {
    var selectedPositionTypes: string[] = jobPositionTypes.length ?
      jobPositionTypes.split(',') : [];
    return this.isPositionTypeSelected(selectedPositionTypes, positionType);
  }

  toggleFormControlValue(formControl: Control, positionType: string, $event) {
    $event.preventDefault();
    let positionTypes: string[] = formControl.value && formControl.value.length ?
      formControl.value.split(',') : [];
    if (this.isPositionTypeSelected(positionTypes, positionType)) {
      // remove position
      positionTypes = positionTypes.filter((type) => type !== positionType);
    } else {
      // add position
      positionTypes.push(positionType);
    }
    (<Control>formControl)
      .updateValue(positionTypes.join(','), this.controlUpdateOptions);
  }

  onSearchInputEnter($event) {
    console.log('onSearchInputEnter ', $event);
  }

  onSearchTermChange(searchTerm: string) {
    (<Control>this.form.controls['term'])
      .updateValue(searchTerm, this.controlUpdateOptions);
  }

  comingSoon($event) {
      $event.preventDefault();
      this.notificationsSvc.push(new NotificationModel({
          message: `Coming soon!`,
          type: 'info'
      }));
  }


  checkAllPositionTypesHandler($event) {
    let isCheckAll = $event.target.checked;
    if (isCheckAll) {
      let allValues = this.JOB_POSITION_TYPES.map((item) => item.value).join(',');
      (<Control>this.form.controls['jobPositionTypes'])
        .updateValue(allValues, this.controlUpdateOptions);
    } else {
      (<Control>this.form.controls['jobPositionTypes'])
        .updateValue('', this.controlUpdateOptions);
    }
  }

  isAllPositionTypesChecked() {
    let formValues = ((<Control>this.form.controls['jobPositionTypes']).value || '').split(',');
    return formValues.length === this.JOB_POSITION_TYPES.length;
  }

  checkAllServicesHandler($event) {
    let isCheckAll = $event.target.checked;
    if (isCheckAll) {
      let allValues = this.JOB_SERVICES.map((item) => item.value).join(',');
      (<Control>this.form.controls['jobServices'])
        .updateValue(allValues, this.controlUpdateOptions);
    } else {
      (<Control>this.form.controls['jobServices'])
        .updateValue('', this.controlUpdateOptions);
    }
  }

  isAllServicesChecked() {
    let formValues = ((<Control>this.form.controls['jobServices']).value || '').split(',');
    return formValues.length === this.JOB_SERVICES.length;
  }

  private isPositionTypeSelected(selectedPositionTypes: string[], positionType: string) {
    return selectedPositionTypes.indexOf(positionType) >= 0;
  }

  private serialize(filter: IFeedFilter): IFeedFilter {
    let serializedFilter = Object.assign({}, filter);
    serializedFilter.description = serializedFilter.jobServices;
    delete serializedFilter.jobServices;
    serializedFilter.subType = serializedFilter.jobPositionTypes;
    delete serializedFilter.jobPositionTypes;
    serializedFilter.location = serializedFilter.cities;
    delete serializedFilter.cities;
    return serializedFilter;
  }
}
