import {UrlValidators} from '../../url/validators/validators';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  JsonPipe
} from 'angular2/common';

export interface SigninFormControlls {
  email: Control;
  password: Control;
}

export const Shared = {

  getSigninFormControlls(): SigninFormControlls {
    return {
      email: new Control('', Shared.getEmailValidators()),
      password: new Control('', Validators.compose([
          Validators.required,
          Validators.minLength
        ]))
    };
  },

  getEmailValidators: function(): any {
    return Validators.compose([Validators.required, UrlValidators.email]);
  }

};
