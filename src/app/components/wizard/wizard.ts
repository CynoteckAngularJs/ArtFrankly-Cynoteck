import {Component, Input, ViewEncapsulation, Output, EventEmitter} from 'angular2/core';
import {FORM_DIRECTIVES} from 'angular2/common';
import {Http} from 'angular2/http';

import {Step} from './step/step';

@Component({
  selector: 'wizard',
  providers: [],
  directives: [...FORM_DIRECTIVES, Step],
  pipes: [],
  styles: [ require('./wizard.css') ],
  template: require('./wizard.html'),
  encapsulation: ViewEncapsulation.None
})
export class Wizard {
  @Output() done: EventEmitter<any> = new EventEmitter();
  @Input() steps;
  activeSlide: Number = 0;

  goToSlide(prevNextstepConf) {
    let step = this.steps.find(step => step.id === prevNextstepConf.nextSlideId);
    this.activeSlide = this.steps.indexOf(step);
    if (prevNextstepConf.fromSlide && !prevNextstepConf.fromSlide.hasNext) {
      this.done.next(prevNextstepConf.fromSlide);
    }
    return false;
  }

}
