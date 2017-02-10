import { Directive, ElementRef, Input } from 'angular2/core';
import {AppService} from '../../components/authentication/services/app-service';

declare var jQuery: any;

@Directive({
  selector: '[fallbackimg]'
})
export class FallbackImgDirective {
  fallbackImage: string = '';
  constructor(
    public appSrv: AppService,
    el: ElementRef
  ) {
    this.fallbackImage = this.appSrv.defaultAvatar;
    let $el = jQuery(el.nativeElement);
    $el.error((e) => {
      $el.attr('src', this.fallbackImage);
    });
  }

}
