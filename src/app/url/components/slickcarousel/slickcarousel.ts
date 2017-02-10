import {
  Component,
  Host,
  Optional,
  ElementRef,
  Input,
  AfterViewInit,
  Output,
  EventEmitter,
  ContentChild,
  ViewEncapsulation
} from 'angular2/core';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  NgFormModel,
  NgFormControl,
  Control,
  ControlGroup,
  NgClass,
  JsonPipe,
  AsyncPipe
} from 'angular2/common';

declare var jQuery: any;

@Component({
  selector: 'slickcarousel',
  directives: [...FORM_DIRECTIVES, NgClass],
  providers: [],
  encapsulation: ViewEncapsulation.None,
  pipes: [AsyncPipe, JsonPipe],
  // styles: [require('./slickcarousel.css')],
  template: require('./slickcarousel.html')
})
export class SlickCarousel implements AfterViewInit {
  @Input() options: any = {};
  $el: any;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.$el = jQuery(this.el.nativeElement);
    let CAROUSEL_SELECTOR = 'carouselitems';
    let CAROUSEL_THUMBS_SELECTOR = 'carouselthumbs';

    if (this.$el.find(CAROUSEL_SELECTOR).length) {
      this.$el.find(CAROUSEL_SELECTOR).slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        fade: true,
        asNavFor: CAROUSEL_THUMBS_SELECTOR
      });
    }

    if (this.$el.find(CAROUSEL_THUMBS_SELECTOR).length) {
      this.$el.find(CAROUSEL_THUMBS_SELECTOR).slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: CAROUSEL_SELECTOR,
        dots: true,
        centerMode: true,
        focusOnSelect: true
      });
    }
  }
}
