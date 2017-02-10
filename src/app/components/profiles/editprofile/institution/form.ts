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
import {
  PROFILES,
  INDUSTRIES,
  VENDOR_INDUSTRIES,
  INSTITUTION_INDUSTRIES,
  COUNTIRES,
  US_STATES
} from '../../../../constants';
import {
  ProfileInstitutionModel,
  IInstitutionGeneral,
  ProfileInstitutionModelForm
} from '../../models/profiles';
import {ProfilesService} from '../../services/profiles-service';
import {Utils} from '../../../../url/utils/index';

@Component({
  selector: 'institution-form',
  directives: [Select2, Ng2Select2],
  pipes: [JsonPipe],
  styles: [ require('../editprofile.css') ],
  template: require('./form.html')
})
export class InstitutionForm implements OnInit, OnChanges {
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  PROFILES: any = PROFILES;
  @Input() profile: IInstitutionGeneral = new ProfileInstitutionModel();
  @Input() user: string;
  @Output() saveerror: EventEmitter<any> = new EventEmitter();
  @Output() savesuccess: EventEmitter<ProfileInstitutionModel> = new EventEmitter();
  @Output() imagechange: EventEmitter<string> = new EventEmitter();
  model: ProfileInstitutionModelForm;
  INDUSTRIES: any = INSTITUTION_INDUSTRIES;
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
    this.model = new ProfileInstitutionModelForm(this.builder, this.profile);
  }

  onImageChange(imageUrl: string) {
    if (imageUrl && imageUrl.length && this.profile && imageUrl !== this.profile.image) {
      this.imagechange.next(imageUrl);
    }
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

  saveOrUpdate(formValue: IInstitutionGeneral) {
    this.isShowErrors = !this.model.form.valid;
    let industry = [...(formValue.industry || [])];
    formValue.industry = industry.join(',');
    if (this.model.form.valid) {
      let profile: ProfileInstitutionModel = new ProfileInstitutionModel(formValue);
      let isAdd = profile.isNew();
      let operation = isAdd ? 'save' : 'update';
      this.profileService[operation](profile).subscribe(
        ((resp) => {
          // resp.industry = industry;
          this.model.updateForm(resp);
          this.savesuccess.next({
            current: new ProfileInstitutionModel(resp),
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
