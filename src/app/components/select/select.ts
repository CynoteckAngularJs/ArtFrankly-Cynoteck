import {Subscription} from 'rxjs/Subscription';
import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  Output,
  EventEmitter,
  Attribute,
  OnDestroy
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

declare var jQuery: any;

@Directive({
  selector: '[select2]'
})
export class Select2 implements AfterViewInit, OnDestroy {
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  ngControl: Control;
  ngControlChangesSubscription: Subscription<string>;
  $el: any;
  $select: any;

  constructor(private el: ElementRef, @Attribute('ngControl') private controlName: Control) {}

  ngAfterViewInit() {
    this.ngControl = this._getNgControl();
    if (this.ngControl) {
      this.ngControlChangesSubscription = this.ngControl.valueChanges.subscribe(
        (value) => this.controlValueChange(value)
      );
    }
    let $el = jQuery(this.el.nativeElement);
    let $select2 = $el.select2();
    this.$el = $el;
    this.$select = $select2;
    $select2.on('change', this.onValueChange.bind(this));
    $select2.on('select2:select', this.onValueSelected.bind(this));
  }

  ngOnDestroy() {
    if (this.ngControlChangesSubscription) {
      this.ngControlChangesSubscription.unsubscribe();
    }
  }

  controlValueChange(value: string) {
    console.log('controlValueChange ', this.controlName, value);
    this.$el.val(value);
    this.$el.trigger('change.select2');
  }

  onValueChange(e) {
    let value = e.target.value;
    if (this.ngControl) {
      this.ngControl.markAsDirty();
      this.ngControl.updateValue(value, {
        onlySelf: false,
        // don't cause a valueChanges event on the Control to be emitted
        emitEvent: false,
        // the view will NOT be notified about the new value via an onChange event
        emitModelToViewChange: false
      });
    }
    this.change.next(value);
  }

  onValueSelected(e) {
    this.selected.next(e.target.value);
  }

  private _getNgControl() {
    let ngControl;
    // TODO: Improve this by searching [ngFormModel] 
    // in constructor and thats it (we than don't need this) 
    if (this.el['_appElement'] &&
      this.el['_appElement'].parentView &&
      this.el['_appElement'].parentView.context
    ) {
      if (this.el['_appElement'].parentView.context.form) {
        ngControl = this.el['_appElement'].parentView.context.form.find(this.controlName);
      } else if (
        this.el['_appElement'].parentView.context.model &&
        this.el['_appElement'].parentView.context.model.form
      ) {
        ngControl = this.el['_appElement'].parentView.context.model.form.find(this.controlName);
      }
    }
    return ngControl;
  }
}
