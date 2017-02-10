import {FormBuilder, Control, ControlGroup} from 'angular2/common';
import {URLSearchParams} from 'angular2/http';
import {PROFILE_TYPES, DEFAULT_AVATARS} from '../../constants';
import {DATE_TIME_FORMAT} from '../../config';

declare var jQuery: any;
declare var moment: any;

export class Utils {
  static scrollTop() {
    jQuery('html, body').animate({ scrollTop: 0 }, 600);
  }

  static scrollTo(selector: string) {
    let $el = jQuery(selector);
    let offset = $el.length ? $el.offset().top + 'px' : 0;
    jQuery('html, body').animate({ scrollTop: offset }, 600);
  }

  static toUrlParams(query: any = {}): URLSearchParams {
    let queries = Object.keys(query)
      .filter(key => query[key] && query[key].length)
      .map((key) => [key, query[key]].join('='));
    var params = new URLSearchParams(queries.join(', '));
    return params;
  }

  static uuid() {
    /* tslint:disable */
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var r = Math.random() * 16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
    /* tslint:enable */
  }

  static format(date: Date, format?: string) {
    let DATE_FORMAT = format || DATE_TIME_FORMAT;
    return moment(date).format(DATE_FORMAT);
  }

  static extractIdFromIRI(iriString: string = '') {
    return ((iriString || '').match(/\d+$/) || [])[0];
  }

  static typeToApiType(type) {
    if (type === PROFILE_TYPES.professional) {
      return 'professionals';
    } else if (type === PROFILE_TYPES.vendor) {
      return 'vendors';
    } else if (type === PROFILE_TYPES.institution) {
      return 'institutions';
    }
  }

  static isVideoFormat(format: string = '') {
    // let VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/ogg'];
    // return VIDEO_FORMATS.indexOf(format) >= 0;
    return format && format.startsWith('video/');
  }

  // Converts (size) to KB
  static toKB(size: number = 0): number {
    return size ? Math.round(<number>size / 1024) : 0;
  }

  static inView(element): boolean {
    return Utils.inViewBox(element.getBoundingClientRect());
  }

  static inViewBox(box): boolean {
    return ((box.bottom < 0) || (box.top > Utils.getWindowSize().h)) ? false : true;
  }

  static getWindowSize() {
    return {
      w: document.body.offsetWidth || document.documentElement.offsetWidth || window.innerWidth,
      h: document.body.offsetHeight || document.documentElement.offsetHeight || window.innerHeight
    };
  }

  static getAllMergedOptions(opts: string[] = [], defaultOpts: IOption[] = []): IOption[] {
    let options = [...defaultOpts];
    let defaultOptsValues = options.map((option) => option.value);
    let nonDefaultValues = opts.filter((value) => defaultOptsValues.indexOf(value) < 0);
    let nonDefaultOptions = (nonDefaultValues || []).map((val) => {
      return {
        value: val,
        label: val
      };
    });
    return [...defaultOpts, ...nonDefaultOptions];
  }

  static getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static getRandomDefaultImage(): string {
    let index = Utils.getRandomInt(0, DEFAULT_AVATARS.length - 1);
    return DEFAULT_AVATARS[index];
  }

  static getAddress(address: any): string[] {
      let DEFAULT_LOCATION = { address: {} };
      let location = Object.assign({}, DEFAULT_LOCATION, address || {});
      let address = location.address || {};
      let locStr = [];
      let segment1: string[] = [];
      let segment2: string[] = [];
      if (address.streetAddress && address.streetAddress.trim().length) {
        segment1.push(address.streetAddress);
      }
      if (address.apartment && address.apartment.trim().length) {
        segment1.push(address.apartment);
      }
      if (segment1.length) {
        locStr.push(segment1.join(' '));
      }

      if (address.city && address.city.trim().length) {
        locStr.push(address.city);
      }

      if (address.addressRegion && address.addressRegion.trim().length) {
        segment2.push(address.addressRegion);
      }
      if (address.postalCode && address.postalCode.trim().length) {
        segment2.push(address.postalCode);
      }
      if (address.addressCountry && address.addressCountry.trim().length) {
        segment2.push(address.addressCountry);
      }
      if (segment2.length) {
        locStr.push(segment2.join(' '));
      }

      return locStr;
  }

  static getAddressString(address: any): string {
    return Utils.getAddress(address).join(', ');
  }

  static isAddressEmpty(address: any): boolean {
    return Utils.getAddress(address).length < 1;
  }

  static toURL(url: string) {
    var pattern = /^(http|https|ftp|\/\/)/;
    if (!pattern.test(url)) {
        url = 'http://' + url;
    }
    return url;
  }

  static isMobile(): any {
    /* tslint:disable */
    var isMobile = {
      Android: function() {
          return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: function() {
          return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: function() {
          return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: function() {
          return navigator.userAgent.match(/Opera Mini/i);
      },
      Windows: function() {
          return navigator.userAgent.match(/IEMobile/i);
      },
      any: function() {
          return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
      },
      anyMobile: function() {
        return isMobile.any() && (window && window.screen && window.screen.width < 760);
      }
    };
    /* tslint:enable */
    return isMobile;
  }
}

export interface JsonLDArray {
  'hydra:member'?: any[];
}

export abstract class Ng2FormDecorator {
  form: ControlGroup;

  constructor(protected builder: FormBuilder, model: any) {
    this.form = this.initForm(model);
  }

  updateControl(controlKey: string, value: any, ctrlUpdateOpts?) {
    (<Control> this.form.controls[controlKey])
      .updateValue(value, ctrlUpdateOpts);
  }

  _updateControl_(control: Control|ControlGroup, model: any, ctrlUpdateOpts?) {
      if (control.hasOwnProperty('controls')) { // if its control group
        Object.keys(control['controls']).forEach((ctrlName) => {
          this._updateControl_(
              (<ControlGroup> control['controls'][ctrlName]),
              model[ctrlName],
              ctrlUpdateOpts
            );
        });
      } else {
        // this.updateControl(ctrlName, model[ctrlName], ctrlUpdateOpts);
        (<Control> control).updateValue(model, ctrlUpdateOpts);
      }
  }

  updateForm(model: any = {}, ctrlUpdateOpts?: any) {
    Object.keys(this.form.controls).forEach((ctrlName) => {
      // this.updateControl(ctrlName, model[ctrlName], ctrlUpdateOpts);
      this._updateControl_(
        (<ControlGroup> this.form.controls[ctrlName]),
        model[ctrlName],
        ctrlUpdateOpts
      );
    });
    // this.updateFormRecoursevly(this.form, model, ctrlUpdateOpts);
  }

  // updateFormRecoursevly(controlGroup: ControlGroup, model: any = {}, ctrlUpdateOpts?: any) {
  //   Object.keys(controlGroup.controls).forEach((ctrlName) => {
  //     if ((<Control> controlGroup.controls[ctrlName])['controls']) { // if its control
  //       this.updateFormRecoursevly(
  //         (<ControlGroup> controlGroup.controls[ctrlName]), model[ctrlName], ctrlUpdateOpts
  //       );
  //     } else {
  //       this.updateControl(ctrlName, model[ctrlName], ctrlUpdateOpts);
  //     }
  //   });
  // }

  abstract initForm(model: any): ControlGroup;
}

export interface JsonLD {
  '@id'?: string;
  cid?: string;
}

export class GenericModel implements JsonLD {
  cid: string;

  static extractId(iriString: string = '') {
    return Utils.extractIdFromIRI(iriString);
  }

  constructor(attributes: JsonLD = {}) {
    this.cid = (attributes && attributes.cid) || Utils.uuid();
    return Object.assign(this, attributes);
  }

  isNew() {
    let id = this.id;
    return !(!!id && id.length);
  }

  equals(model: GenericModel) {
    return !!this['@id'] && !!model['@id'] ? this['@id'] === model['@id'] : this.cid === model.cid;
  }

  merge(model: any) {
    Object.keys(model).forEach((key) => {
      // Merge any property other than @id or cid (those 2 have to stay the same)
      if (key !== '@id' || key !== 'cid') {
        this[key] = model[key];
      }
    });
  }

  update(model: any) {
    Object.keys(model).forEach((key) => {
      this[key] = model[key];
    });
  }

  serialize() {
    let clone = Object.assign({}, this);
    delete clone.cid;
    if (this.isNew()) {
      delete clone['@id'];
    }
    return clone;
  }

  get id(): string {
    return GenericModel.extractId(this['@id']);
  }
}

export class ArrayUtils {
  static remove(items: any[] = [], item: any): any[] {
    return ArrayUtils.removeByIndex(items, ArrayUtils.findIndex(items, item));
  }

  static removeByIndex(items: any[] = [], index: number): any[] {
    let array: any[] = [...items];
    if (index >= 0) {
      array.splice(index, 1);
    }
    return array;
  }

  static findIndex (array: GenericModel[], item: GenericModel): number {
    return array.findIndex((citem) => item.equals(citem));
  }

  static push(array: any[] = [], item: any) {
    return item ? [...array, item] : [...array];
  }

  static update(array: any[] = [], item: any) {
    return this.updateByIndex(array, ArrayUtils.findIndex(array, item), item);
  }

  static updateByIndex(array: any[] = [], index: number, item: any) {
    return index < 0 ? array : array.map((citem, cindex) => {
      return cindex === index ? item : citem;
    });
  }
}

export interface IUpload extends JsonLD {
  created?: Date;
  updated?: Date;
  createdBy?: string;
  id?: string;
  bitrate?: string;
  contentSize?: string;
  contentUrl?: string;
  description?: string;
  duration?: string;
  encodingFormat?: string;
  height?: string;
  name?: string;
  uploadDate?: Date;
  width?: string;
  fileFormat?: string;
  originalFileName?: string;
  linkedObject?: string;
}

export class UploadModel extends GenericModel implements IUpload {
  contentUrl: string;
  fileFormat: string;
  contentSize: string;

  constructor(attributes?: IUpload) {
    super(attributes);
    return Object.assign(this, {}, attributes);
  }

  toWrappedMedia(): IWrappedMedia {
    return {
        '@id': this['linkedObject'],
        mediaObject: {
          '@id': this['@id'],
          '@type': this['@type'],
          contentUrl: this['contentUrl'],
          fileFormat: this['fileFormat']
        }
      };
  }

  // Get size in KBs
  get size(): number {
    let _size = parseInt(this.contentSize, 10) || 0;
    return Utils.toKB(_size);
  }
}

export interface IMedia extends JsonLD {
  id?: string;
  '@type'?: string;
  'contentUrl'?: string;
  fileFormat?: string;
}

export class MediaModel extends GenericModel implements IMedia {
  '@type': string;
  contentUrl: string;
  fileFormat: string;

  constructor(attributes: IMedia = {}) {
    super(attributes);
    Object.assign(this, attributes);
  }
}

export interface IWrappedMedia extends JsonLD {
  '@type'?: string;
  mediaObject?: IMedia;
}

export class WrappedMediaModel extends GenericModel implements IWrappedMedia {
  mediaObject: IMedia;

  constructor(attributes: IWrappedMedia = {}) {
    super(attributes);
    Object.assign(this, attributes);
    this.mediaObject = new MediaModel(this.mediaObject);
  }

  get mediaId() {
    return this.mediaObject.id;
  }
}

export interface IOption {
  value: string;
  label: string;
}
