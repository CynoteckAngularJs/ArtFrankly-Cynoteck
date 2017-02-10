import {Component, Input, Output, EventEmitter, OnInit, ViewChild} from 'angular2/core';
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
import {
  ROUTES,
  NOTIFICATION_TAGS,
  COUNTIRES,
  US_STATES
} from '../../../constants';
import {
  AppService,
  IApp,
  DEFAULTS,
  ACTIONS
} from '../../../components/authentication/services/app-service';
import {Ng2Select2} from '../ng2select2/select2';
import {Utils} from '../../utils/index';
import {UrlValidators} from '../../validators/validators';
import {INamedAddress, IAddress} from '../../../components/job/post/models';
declare var jQuery: any;

@Component({
  selector: 'address-form',
  directives: [
    ...ROUTER_DIRECTIVES,
    NgClass,
    Ng2Select2
  ],
  providers: [],
  pipes: [AsyncPipe, JsonPipe],
  styles: [require('./address.css')],
  template: require('./address.html')
})
export class AddressForm implements OnInit {
  @Output() saved: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Input() location: INamedAddress;
  @Input() placeholderprefix: string;
  @Input() hidelocationname: boolean;
  @Input() hidelocationtelephone: boolean;
  @Input() hidezip: boolean;
  @Input() hidestreetaddress: boolean;
  @Input() hideappartment: boolean;
  @Input() namelabel: string;
  @Input() phonelabel: string;
  COUNTIRES: any[] = COUNTIRES;
  US_STATES: any[] = US_STATES;
  form: ControlGroup;
  isShowErrors: boolean = false;
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  countrySelect2Options: any = {
    placeholder: 'COUNTRY',
    tags: true
  };
  stateSelect2Options: any = {
    placeholder: 'STATE',
    tags: true
  };

  constructor(
    private builder: FormBuilder,
    private router: Router,
    private routeParams: RouteParams,
    public appSrv: AppService
  ) {
    this.initForm();
    this.form.valueChanges.subscribe((values) => {
        this.change.next(values.location);
      });
  }

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.location.currentValue) {
      this.setFormValues(this.location);
    }
  }

  setFormValues(location: INamedAddress = {}) {
    let DEFAULTS = { address: {} };
    location = Object.assign({}, DEFAULTS, location);
    /* tslint:disable */
    (<Control> this.form.controls['location']['controls']['@id']).updateValue(location['@id'], this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['name']).updateValue(location.name, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['@id']).updateValue(location.address['@id'], this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['addressCountry']).updateValue(location.address.addressCountry, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['addressLocality']).updateValue(location.address.addressLocality, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['addressRegion']).updateValue(location.address.addressRegion, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['postalCode']).updateValue(location.address.postalCode, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['postOfficeBoxNumber']).updateValue(location.address.postOfficeBoxNumber, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['streetAddress']).updateValue(location.address.streetAddress, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['telephone']).updateValue(location.address.telephone, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['apartment']).updateValue(location.address.apartment, this.controlUpdateOptions);
    (<Control> this.form.controls['location']['controls']['address']['controls']['city']).updateValue(location.address.city, this.controlUpdateOptions);
    /* tslint:enable */
  }

  initForm() {
    let DEFAULTS = { address: {} };
    let location = Object.assign({}, DEFAULTS, this.location);
    this.namelabel = this.namelabel || 'Location Name';
    this.phonelabel = this.phonelabel || 'Phone';
    this.form = this.builder.group({
      location: this.builder.group({
        '@id': [location['@id']],
        '@type': ['http://schema.org/Place'],
        name: [location.name],
        address: this.builder.group({
          '@id': [location.address['@id']],
          '@type': ['http://schema.org/PostalAddress'],
          addressCountry: [location.address.addressCountry],
          addressLocality: [location.address.addressLocality],
          addressRegion: [location.address.addressRegion],
          postalCode: [location.address.postalCode],
          postOfficeBoxNumber: [location.address.postOfficeBoxNumber],
          streetAddress: [location.address.streetAddress],
          telephone: [location.address.telephone],
          apartment: [location.address.apartment],
          city: [location.address.city],
        })
      })
		});
  }

}
