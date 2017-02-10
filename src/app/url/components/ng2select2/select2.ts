import {
  Directive,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit
} from 'angular2/core';
import {Control, NgControlName} from 'angular2/common';

declare var jQuery: any;

export function isEmpty(obj : any) : boolean {
   if (typeof obj === 'undefined' || obj === null || obj === '') return true;
   if (typeof obj === 'number' && isNaN(obj)) return true;
   if (obj instanceof Date && isNaN(Number(obj))) return true;
   if (typeof obj === 'object' && isEmptyObject(obj)) return true;
   return false;
}

function isEmptyObject(obj : any) : boolean {
	var name;
	 for ( name in obj ) {
		 return false;
	 }
	 return true;
}

@Directive({
	selector: '[ng2select2]'
})
export class Ng2Select2 implements AfterViewInit {
  @Input('ng2select2') control: NgControlName;
  @Input('ng2select2options') options: any = {};
  @Output() opened: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() selected: EventEmitter<any> = new EventEmitter();
  private _element : any;

	constructor(private _elementRef : ElementRef) {
    console.log('CONSTRUCTOR ng2Select2: ', this._element);
		this._element = jQuery(_elementRef.nativeElement);
	}

	ngAfterViewInit() {
    let self = this;
    this._element.select2(this.options);
		var fnChange = function() {
      console.log('fnChange ', arguments);
			if (this.control.value !== this._element.val()) {
        // this.control.viewToModelUpdate(this._element.val());
        (<Control> this.control.control).updateValue(this._element.val(), {
            onlySelf: false,
            emitEvent: true,
            emitModelToViewChange: false
        });
		 	}
		};
    let fnOnOpen = function(e) {
      // console.log('fnOnOpen ', arguments);
      self.opened.next(e);
      // Mark preselected values correctly (as selected) - hack!
      this._element.val(this.control.control.value).trigger('change.select2');
    };
    let fnOnSelected = function(e) {
      self.selected.next(e.currentTarget && e.currentTarget.value);
    };

    this._element.on('change', fnChange.bind(this));
    this._element.on('select2:open', fnOnOpen.bind(this));
    this._element.on('select2:select', fnOnSelected.bind(this));
    this._element.val(this.control.value).trigger('change');

    (<Control> this.control.control).valueChanges.subscribe(
        (value) => {
            console.log('Select2 control\'s value change: ', value);
            self._element.val(value).trigger('change.select2');
            self.change.next(value);
        }
    );
	}
}
