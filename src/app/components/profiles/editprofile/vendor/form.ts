import {
  Component,
  Input,
  Output,
  ViewEncapsulation,
  EventEmitter,
  OnChanges,
  OnInit
} from 'angular2/core';
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
import {Select2} from '../../../select/select';
import {Ng2Select2} from '../../../../url/components/ng2select2/select2';
import {Shared, SigninFormControlls} from '../../../authentication/shared';
import {PROFILES,
  INDUSTRIES,
  VENDOR_INDUSTRIES,
  INSTITUTION_INDUSTRIES,
  AVAILABILITY,
  COUNTIRES,
  US_STATES
} from '../../../../constants';
import {
  ProfileVendorModel,
  IVendorGeneral,
  ProfileVendorModelForm
} from '../../models/profiles';
import {ProfilesService} from '../../services/profiles-service';
import {Utils} from '../../../../url/utils/index';

@Component({
  selector: 'vendor-form',
  directives: [Select2, Ng2Select2],
  pipes: [JsonPipe],
  styles: [ require('../editprofile.css') ],
  template: require('./form.html')
})
export class VendorForm implements OnInit, OnChanges {
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  PROFILES: any = PROFILES;
  @Input() profile: IVendorGeneral = new ProfileVendorModel();
  @Input() user: string;
  @Output() saveerror: EventEmitter<any> = new EventEmitter();
  @Output() savesuccess: EventEmitter<ProfileVendorModel> = new EventEmitter();
  @Output() imagechange: EventEmitter<ProfileVendorModel> = new EventEmitter();
  model: ProfileVendorModelForm;
  INDUSTRIES: any = VENDOR_INDUSTRIES;
  AVAILABILITY: any = AVAILABILITY;
  COUNTIRES: any[] = COUNTIRES;
  US_STATES: any[] = US_STATES;
  countrySelect2Options: any = {
    placeholder: 'COUNTRY',
    tags: true
  };
  stateSelect2Options: any = {
    placeholder: 'STATE',
    tags: true
  };
  industrySelect2Options: any = {
    placeholder: 'INDUSTRY'
  };
  isShowErrors: boolean = false;

  constructor(
    private builder: FormBuilder,
    private profileService: ProfilesService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.model = new ProfileVendorModelForm(this.builder, this.profile);
  }

  ngOnChanges(changes) {
    if (this.model) {
      if (changes.user && changes.user.currentValue) {
        this.profile.user = this.user;
        this.model.updateControl('user', this.user, this.controlUpdateOptions);
      }
      if (changes.profile && changes.profile.currentValue) {
        this.model.updateForm(this.profile, this.controlUpdateOptions);
      }
    }
  }

  onImageChange(imageUrl: string) {
    if (imageUrl && imageUrl.length && this.profile && imageUrl !== this.profile.image) {
      this.imagechange.next(imageUrl);
    }
  }

  saveOrUpdate(formValue: IVendorGeneral) {
    this.isShowErrors = !this.model.form.valid;
    let industry = [...(formValue.industry || [])];
    formValue.industry = industry.join(',');
    if (this.model.form.valid) {
      let profile: ProfileVendorModel = new ProfileVendorModel(formValue);
      let isAdd = profile.isNew();
      let operation = isAdd ? 'save' : 'update';
      this.profileService[operation](profile).subscribe(
        ((resp) => {
          this.model.updateForm(resp);
          this.savesuccess.next({
            current: new ProfileVendorModel(resp),
            previous: profile
          });
        }).bind(this),
        ((resp) => {
          this.saveerror.next(resp);
        }).bind(this)
      );
    }
  }

  getIndustry(industry: string = ''): string[] {
    return (industry || '').split(',');
  }
}
