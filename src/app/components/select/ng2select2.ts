import {
  Component,
  Host,
  Optional,
  ElementRef,
  Input,
  AfterViewInit,
  Output,
  EventEmitter,
  ContentChild
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
  selector: 'ng2select2',
  directives: [...FORM_DIRECTIVES, NgClass],
  providers: [],
  inputs: ['controlName: control'],
  pipes: [AsyncPipe, JsonPipe],
  styles: [require('./ng2select2.css')],
  template: require('./ng2select2.html')
})
export class Ng2Select2 implements AfterViewInit {
  @Input() required: boolean = false;
  // @Input() ngControl: Control;
  @ContentChild(NgFormControl) state;
  @Input() ngFormModel: ControlGroup;
  @Input() options: any[];
  @Input() select2config: any = {};
  @Input() selectedvalue: any[];
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();

  constructor(private el: ElementRef) {
    console.log('constructor ', this);
  }

  ngAfterViewInit() {
    let $el = jQuery(this.el.nativeElement);
    var $select2 = $el.select2(this.select2config);
    $select2.on('change', this.onValueChange.bind(this));
    $select2.on('select2:select', this.onValueSelected.bind(this));
  }

  onValueChange(e) {
    this.change.next(e.target.value);
  }

  onValueSelected(e) {
    this.selected.next(e.target.value);
  }
}
