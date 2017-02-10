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
  selector: 'ng2owlcarousel',
  directives: [...FORM_DIRECTIVES, NgClass],
  providers: [],
  encapsulation: ViewEncapsulation.None,
  pipes: [AsyncPipe, JsonPipe],
  styles: [require('./ng2owlcarousel.css')],
  template: require('./ng2owlcarousel.html')
})
export class Ng2OwlCarousel implements AfterViewInit {
  // @Input() ngControl: Control;
  // @ContentChild(NgFormControl) state;
  @Input() options: any = {};
  @Input() thumbsoptions: any = {};
  @Input() detailsoptions: any = {};
  @Input() items: any = [];
  // @Output() change: EventEmitter<any> = new EventEmitter();
  // @Output() selected: EventEmitter<any> = new EventEmitter();
  $el: any;
  $carousel: any;
  carouselOpts: any = {
			items: 1,
			margin: 10,
			nav: true,
			loop: true
		};
  $thumbs: any;
  thumbsOpts: any = {
			margin: 20,
			items: 6,
			nav: false,
			center: true
  };
  $details: any;
  detailsOpts: any = {
    items: 1,
    margin: 10,
    nav: false
  };
  isShowCarousel: boolean = true;

  constructor(private el: ElementRef) {
    console.log('constructor ', this);
    this.options = Object.assign(this.carouselOpts, this.options);
    this.thumbsoptions = Object.assign(this.thumbsOpts, this.thumbsoptions);
    this.detailsoptions = Object.assign(this.detailsOpts, this.detailsoptions);
  }

  ngAfterViewInit() {
    this.$el = jQuery(this.el.nativeElement);
    let $carousel = this.$carousel = this.$el.find('carouselitems');
    let $thumbs = this.$thumbs = this.$el.find('carouselthumbs');
    let $details = this.$details = this.$el.find('carouseldetails');
    let flag = false;
		let duration = 300;

    if (this.$carousel.length) {
      this.$carousel.owlCarousel(this.options)
        .on('changed.owl.carousel', function (e) {
          if (!flag) {
            flag = true;
            $thumbs.trigger('to.owl.carousel', [e.item.index, duration, true]);
            $details.trigger('to.owl.carousel', [e.item.index, duration, true]);
            flag = false;
          }
        });
    }

    if (this.$thumbs.length) {
      this.$thumbs.owlCarousel(this.thumbsoptions)
        .on('click', '.owl-item', function () {
            $carousel.trigger('to.owl.carousel', [jQuery(this).index(), duration, true]);
          })
          .on('changed.owl.carousel', function (e) {
            if (!flag) {
              flag = true;
              $carousel.trigger('to.owl.carousel', [e.item.index, duration, true]);
              flag = false;
            }
          });
    }

    if (this.$details.length) {
      this.$details.owlCarousel(this.detailsoptions)
        .on('click', '.owl-item', function () {
            $carousel.trigger('to.owl.carousel', [jQuery(this).index(), duration, true]);
          })
          .on('changed.owl.carousel', function (e) {
            if (!flag) {
              flag = true;
              $carousel.trigger('to.owl.carousel', [e.item.index, duration, true]);
              flag = false;
            }
          });
    }
    // $select2.on('change', this.onValueChange.bind(this));
    // $select2.on('select2:select', this.onValueSelected.bind(this));
  }

  hideCarousel() {
    this.isShowCarousel = false;
  }
  // onValueChange(e) {
  //   this.change.next(e.target.value);
  // }

  // onValueSelected(e) {
  //   this.selected.next(e.target.value);
  // }
}
