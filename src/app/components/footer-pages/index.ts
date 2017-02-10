import {Component,
  Input,
  ViewEncapsulation,
  Output,
  EventEmitter
} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location} from 'angular2/router';
import {FORM_DIRECTIVES, JsonPipe, AsyncPipe, NgClass} from 'angular2/common';
import {Http} from 'angular2/http';

// import {Step} from './step/step';
let FOOTER_PAGES = require('./footerPages.json');

@Component({
  selector: 'footer-pages',
  providers: [],
  directives: [...FORM_DIRECTIVES, ...ROUTER_DIRECTIVES, NgClass],
  pipes: [],
  styles: [ require('./index.css') ],
  template: require('./index.html'),
  encapsulation: ViewEncapsulation.None
})
export class FooterPages {
  @Output() done: EventEmitter<any> = new EventEmitter();
  @Input() pages;
  selectedPageIndex: Number = 0;
  selectedPageSlug: string;

  constructor(
    private router: Router,
    private routeParams: RouteParams
  ) {
    this.pages = this.pages || FOOTER_PAGES;
    let requestedPage = this.routeParams.get('slug');
    this.selectedPageSlug = requestedPage ? requestedPage : this.pages[0].slug;
  }
}
