import {Component, Input, Output, EventEmitter} from 'angular2/core';
import {FORM_DIRECTIVES} from 'angular2/common';
import {Http} from 'angular2/http';

@Component({
  selector: 'step',
  styles: [ require('./step.css') ],
  template: require('./step.html')
})
export class Step {
  @Input() step;
  @Output() next: EventEmitter<any> = new EventEmitter();

  goToSlide($event, slide) {
    let slideId = slide.next;
    this.next.emit({ nextSlideId: slideId, fromSlide: slide });
    $event.preventDefault();
  }
}
