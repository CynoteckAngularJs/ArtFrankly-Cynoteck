import {
  Component,
  Input,
  Output,
  ViewEncapsulation,
  EventEmitter,
  OnChanges,
  OnInit,
  ViewChild,
  ViewChildren,
  QueryList
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
  AVAILABILITY,
  PROFESSIONS,
  COUNTIRES,
  US_STATES
} from '../../../../constants';
import {
  ProfileProfessionalModel,
  IProfessionalGeneral,
  ProfileProfessionalModelForm
} from '../../models/profiles';
import {ProfilesService} from '../../services/profiles-service';
import {Utils} from '../../../../url/utils/index';
import {AddressForm} from '../../../../url/components/address/address';

declare var moment: any;

@Component({
  selector: 'professional-form',
  directives: [
    Select2,
    Ng2Select2,
    AddressForm
  ],
  pipes: [JsonPipe],
  styles: [ require('../editprofile.css') ],
  template: require('./form.html')
})
export class ProfessionalForm implements OnInit, OnChanges {
  controlUpdateOptions: any = { onlySelf: false, emitEvent: true };
  PROFILES: any = PROFILES;
  @Input() profile: IProfessionalGeneral = new ProfileProfessionalModel();
  @Input() user: string;
  @Output() saveerror: EventEmitter<any> = new EventEmitter();
  @Output() savesuccess: EventEmitter<ProfileProfessionalModel> = new EventEmitter();
  @Output() imagechange: EventEmitter<string> = new EventEmitter();
  model: ProfileProfessionalModelForm;
  AVAILABILITY: any = AVAILABILITY;
  PROFESSIONS: any = PROFESSIONS;
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
  professionSelect2Options: any = {
    placeholder: 'PROFESSION'
  };
  isShowErrors: boolean = false;
  @ViewChildren(AddressForm)
  addressForms: QueryList<AddressForm>;

  constructor(
    private builder: FormBuilder,
    private profileService: ProfilesService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.model = new ProfileProfessionalModelForm(this.builder, this.profile);
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

  saveOrUpdate(formValue: any) {
    this.isShowErrors = !this.model.form.valid;
    if ((formValue.birthDate || '').trim().length) {
      // formValue.birthDate = moment(formValue.birthDate).toDate();
      formValue.birthDate = moment(formValue.birthDate).local().format('YYYY-MM-DD');
    } else {
      formValue.birthDate = null;
    }
    formValue.location = this.addressForms.first.form.value.location;
    let profession = [...(formValue.profession || [])];
    formValue.profession = profession.join(',');
    if (this.model.form.valid) {
      let profile: ProfileProfessionalModel = new ProfileProfessionalModel(formValue);
      let isAdd = profile.isNew();
      let operation = isAdd ? 'save' : 'update';
      this.profileService[operation](profile).subscribe(
        ((resp) => {
          console.log('Profile Update SUCCESS', resp);
          // resp.profession = profession;
          this.model.updateForm(resp);
          this.savesuccess.next({
            current: new ProfileProfessionalModel(resp),
            previous: profile
          });
        }).bind(this),
        ((resp) => {
          console.log('Profile Update FAIL', resp);
          this.saveerror.next(resp);
        }).bind(this),
        () => {
          console.log('Profile Update COMPLETE');
        }
      );
    }
  }

  isSelected(val1: string, val2: string): boolean {
    return val1 === val2;
  }
}
