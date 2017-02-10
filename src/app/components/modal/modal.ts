import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  ViewEncapsulation
} from 'angular2/core';
import {FORM_DIRECTIVES} from 'angular2/common';

export interface IModal {
  opened?: boolean;
  title?: string;
  closeable?: boolean;
  hideOnClose?: boolean;
}

export const DEFAULTS = {
  opened: true,
  closeable: true,
  title: 'Modal <b>Dialog</b>',
  hideOnClose: false,
};

@Component({
  selector: 'modal',
  styles: [ require('./modal.css') ],
  template: require('./modal.html'),
  encapsulation: ViewEncapsulation.None
})
/**
 * Usage:
 * <modal [modal]="modal">
 * <modal-title>
 *  <h3 class="modal-title">{{modal.title}}</h3>
 * </modal-title>
 * <modal-body>
 *  <p>Some content</p>
 * </modal-body>
 * </modal>
 */
export class Modal implements OnInit {
  @Input() modal: IModal;
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Output() onhide: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {
    this.modal = Object.assign(DEFAULTS, this.modal);
  }

  // ngOnChanges(changes) {
  //   if (changes.modal && changes.modal.currentValue) {
  //     this.modal = changes.modal;
  //   }
  // }

  onClose($event) {
    $event.preventDefault();
    if (this.modal.hideOnClose) {
      this.hide();
    } else {
      this._close();
    }
  }

  destroy() {
    this._close();
  }

  hide() {
    this.modal.opened = false;
    let modal: IModal = Object.assign({}, this.modal);
    this.onhide.next(modal);
  }

  private _close() {
    let modal: IModal = Object.assign({}, this.modal);
    delete this.modal;
    this.close.next(modal);
  }
}
