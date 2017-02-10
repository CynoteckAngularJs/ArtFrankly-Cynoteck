import {Control, Validators} from 'angular2/common';
import {Utils} from '../utils/index';
import {DATE_FORMAT, DATE_TIME_FORMAT} from '../../config';

declare var moment: any;

interface ValidationResult {
   [key: string]: boolean;
}

// declare var moment: any;

export class UrlValidators {
  static requiredWhenAny(dependentControl: Control, dependentControlValues: any[] = []) {
    return (): ValidationResult => {
      if (
        !dependentControl ||
        !dependentControl.value ||
        dependentControlValues.indexOf(dependentControl.value
      ) < 0) {
        return { requiredWhenAny: true };
      }
      return null;
    };
  }

  static email(control: Control): ValidationResult {
    var requireResult: ValidationResult = Validators.required(control);
    if (requireResult !== null) {
        return requireResult;
    }
    /* tslint:disable */
    var mailRE = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    /* tslint:enable */
    if (control.value !== '' && !mailRE.test(control.value)) {
        return { email: true };
    }
    return null;
  }

static emailValidationWithoutRequired(control: Control): ValidationResult {
    /* tslint:disable */
    var mailRE = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    /* tslint:enable */
    if (control.value && !mailRE.test(control.value)) {
        return { emailValidationWithoutRequired: true };
    }
    return null;
  }
  
  static url(control: Control): ValidationResult {
    /* tslint:disable */
    // var urlRE =/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
    // var urlRE = /\b((?:[a-z][\w\-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\((?:[^\s()<>]|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]|(?:\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
    var urlRE = /([--:\w?@%&+~#=]*\.[a-z]{2,4}\/{0,2})((?:[?&](?:\w+)=(?:\w+))+|[--:\w?@%&+~#=]+)?/g;
    /* tslint:enable */
    if (control.value && !urlRE.test(control.value)) {
        return { url: true };
    }
    return null;
  }

  static number(control: Control): ValidationResult {
    /* tslint:disable */
    var numberRE = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    /* tslint:enable */
    if (control.value !== '' && !numberRE.test(control.value)) {
        return { number: true };
    }
    return null;
  }

  /**
   * Supported formats:
   * (123) 456-7890
   * +(123) 456-7890
   * +(123)-456-7890
   * +(123) - 456-7890
   * +(123) - 456-78-90
   * 123-456-7890
   * 123.456.7890
   * 1234567890
   * +31636363634
   * 075-63546725
   */
  static phone(control: Control): ValidationResult {
    /* tslint:disable */
    var phoneRE = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;
    /* tslint:enable */
    if (control.value && !phoneRE.test(control.value)) {
        return { phone: true };
    }
    return null;
  }

  static datetime(control: Control): ValidationResult {
    let isValidFormat = moment(control.value, DATE_TIME_FORMAT, true).isValid();
    if ((control.value || '').trim().length > 0 && !isValidFormat) {
      return { datetime: true };
    }
    return null;
  }

  static date(control: Control): ValidationResult {
    let isValidFormat = moment(control.value, DATE_FORMAT, true).isValid();
    if ((control.value || '').trim().length > 0 && !isValidFormat) {
      return { date: true };
    }
    return null;
  }
}
