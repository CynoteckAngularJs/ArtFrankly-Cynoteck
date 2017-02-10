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
  JOB_SERVICES,
  INDUSTRIES,
  VENDOR_INDUSTRIES,
  INSTITUTION_INDUSTRIES,
  PROFESSIONS,
  FEED_PROFILE_TYPES
} from '../../../../../constants';
import {Ng2Select2} from '../../../../../url/components/ng2select2/select2';
import {SearchForm} from '../../../../search/form/search';

@Component({
  selector: 'profiles-filter',
  directives: [...ROUTER_DIRECTIVES, ...FORM_DIRECTIVES, NgClass, Ng2Select2, SearchForm],
  providers: [FeedsService],
  styles: [ require('../filter.css') ],
  template: require('./filter.html'),
  encapsulation: ViewEncapsulation.None
})
export class ProfilesFilter implements OnInit, OnChanges {
  @Input() term: string;
  @Input() industries: string;
  @Input() professions: string;
  @Input() profileTypes: string;
  @Input() cities: string;
  @Input() radius: string;
  @Output() filterchange: EventEmitter<any> = new EventEmitter();
  FILTER_TYPES: any = FILTER_TYPES;
  JOB_POSITION_TYPES: any = JOB_POSITION_TYPES;
  JOB_SERVICES: any = JOB_SERVICES;
  PROFESSIONS: any = PROFESSIONS;
  INSTITUTION_INDUSTRIES: any = INSTITUTION_INDUSTRIES;
  VENDOR_INDUSTRIES: any = VENDOR_INDUSTRIES;
  INDUSTRIES: any = [...VENDOR_INDUSTRIES, ...INSTITUTION_INDUSTRIES];
  FEED_PROFILE_TYPES: any = FEED_PROFILE_TYPES;
  selectedType: string;
  form: ControlGroup;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };

  constructor(
      private router: Router,
      private location: Location,
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
    this.form = this.builder.group({
      type: [FEED_TYPES.profile],
      // sort: [FEED_SORT_PARAM_VALUES.DESC],
      term: [this.term || ''],
      industries: [this.industries || ''],
      professions: [this.professions || ''],
      profileTypes: [this.profileTypes || ''],
      cities: [this.cities || ''],
      radius: [this.radius || '']
		});
  }

  updateForm() {
    (<Control>this.form.controls['term'])
      .updateValue(this.term, this.controlUpdateOptions);
    (<Control>this.form.controls['industries'])
      .updateValue(this.industries, this.controlUpdateOptions);
    (<Control>this.form.controls['professions'])
      .updateValue(this.professions, this.controlUpdateOptions);
    (<Control>this.form.controls['profileTypes'])
      .updateValue(this.profileTypes, this.controlUpdateOptions);
    (<Control>this.form.controls['cities'])
      .updateValue(this.cities, this.controlUpdateOptions);
    (<Control>this.form.controls['radius'])
      .updateValue(this.radius, this.controlUpdateOptions);
  }

  triggerFilter(filter: IFeedFilter) {
    this.filterchange.next(this.serialize(filter));
  }

  isChecked(industries: string = '', positionType: string) {
    var selectedPositionTypes: string[] = industries.length ?
      industries.split(',') : [];
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



  checkAllIndustriesHandler($event) {
    let isCheckAll = $event.target.checked;
    let values = ((<Control>this.form.controls['industries']).value || '').split(',');
    if (isCheckAll) {
      let allValues = [...values, ...this.INSTITUTION_INDUSTRIES.map((item) => item.value)];
      (<Control>this.form.controls['industries'])
        .updateValue(allValues.join(','), this.controlUpdateOptions);
    } else {
      // (<Control>this.form.controls['industries'])
      //   .updateValue('', this.controlUpdateOptions);
      // From form.controls['industries']) remove all INSTITUTION_INDUSTRIES entries
      let institutionIndustriesValues = this.INSTITUTION_INDUSTRIES.map((item) => item.value);
      let newValues = values.reduce((acc, item) => {
        if (institutionIndustriesValues.indexOf(item) < 0) {
          acc.push(item);
        }
        return acc;
      }, []);
      (<Control>this.form.controls['industries'])
        .updateValue(newValues.join(','), this.controlUpdateOptions);
    }
  }

  isAllIndustriesChecked() {
    // let formValues = ((<Control>this.form.controls['industries']).value || '').split(',');
    // return formValues.length === this.INSTITUTION_INDUSTRIES.length;
    let values = (<Control>this.form.controls['industries']).value || '';
    let nrOfMachedValues = INSTITUTION_INDUSTRIES.reduce((acc, item) => {
      return values.indexOf(item.value) > -1 ? acc + 1 : acc;
    }, 0);
    return nrOfMachedValues === this.INSTITUTION_INDUSTRIES.length;
  }

  checkAllProfessionsHandler($event) {
    let isCheckAll = $event.target.checked;
    if (isCheckAll) {
      let allValues = this.PROFESSIONS.map((item) => item.value).join(',');
      (<Control>this.form.controls['professions'])
        .updateValue(allValues, this.controlUpdateOptions);
    } else {
      (<Control>this.form.controls['professions'])
        .updateValue('', this.controlUpdateOptions);
    }
  }

  isAllProfessionsChecked() {
    let formValues = ((<Control>this.form.controls['professions']).value || '').split(',');
    return formValues.length === this.PROFESSIONS.length;
  }

  checkAllVendorIndustriesHandler($event) {
    let isCheckAll = $event.target.checked;
    let values = ((<Control>this.form.controls['industries']).value || '').split(',');
    if (isCheckAll) {
      let allValues = [...values, ...this.VENDOR_INDUSTRIES.map((item) => item.value)];
      (<Control>this.form.controls['industries'])
        .updateValue(allValues.join(','), this.controlUpdateOptions);
    } else {
      // (<Control>this.form.controls['industries'])
      //   .updateValue('', this.controlUpdateOptions);
      // form.controls['industries']) remove all VENDOR_INDUSTRIES entries
      let vendorIndustriesValues = this.VENDOR_INDUSTRIES.map((item) => item.value);
      let newValues = values.reduce((acc, item) => {
        if (vendorIndustriesValues.indexOf(item) < 0) {
          acc.push(item);
        }
        return acc;
      }, []);
      (<Control>this.form.controls['industries'])
        .updateValue(newValues.join(','), this.controlUpdateOptions);
    }
  }

  isAllVendorIndustriesChecked() {
    // let formValues = ((<Control>this.form.controls['industries']).value || '').split(',');
    // return formValues.length === this.VENDOR_INDUSTRIES.length;
    let values = (<Control>this.form.controls['industries']).value || '';
    let nrOfMachedValues = VENDOR_INDUSTRIES.reduce((acc, item) => {
      return values.indexOf(item.value) > -1 ? acc + 1 : acc;
    }, 0);
    return nrOfMachedValues === this.VENDOR_INDUSTRIES.length;
  }

  private isPositionTypeSelected(selectedPositionTypes: string[], positionType: string) {
    return selectedPositionTypes.indexOf(positionType) >= 0;
  }

  private serialize(filter: IFeedFilter): IFeedFilter {
    let serializedFilter = Object.assign({}, filter);
    serializedFilter.description = serializedFilter.professions;
    delete serializedFilter.professions;
    serializedFilter.subtitle = serializedFilter.industries;
    delete serializedFilter.industries;
    serializedFilter.subType = serializedFilter.profileTypes;
    delete serializedFilter.profileTypes;
    serializedFilter.location = serializedFilter.cities;
    delete serializedFilter.cities;
    return serializedFilter;
  }
}
