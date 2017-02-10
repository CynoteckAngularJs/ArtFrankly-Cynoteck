import {Directive, ElementRef, Input} from 'angular2/core';
import {Subscription} from 'rxjs/Subscription';
import {AppService, IApp, DEFAULTS} from '../authentication/services/app-service';

/**
 * activeProfileSpacePostsNumber
 */
@Directive({
  selector: '[activeprofilespacepostsnumber]'
})
export class ActiveProfileSpacePostsNumber {
  _el: HTMLElement;
  activeProfileSpacePosts$: Subscription<any>;

  constructor(
    el: ElementRef,
    public appSrv: AppService
  ) {
    this._el = el.nativeElement;

    this.activeProfileSpacePosts$ = this.appSrv.$stream
      .map((state) => state.selectedProfileSpacePosts)
      .subscribe((spacePosts) => this.onSpacePostsSet(spacePosts));
  }

  ngOnDestroy() {
    this.activeProfileSpacePosts$.unsubscribe();
  }

  onSpacePostsSet(spacePosts = []) {
    this.updateSpacePostNumber(spacePosts.length.toString());
  }

  private updateSpacePostNumber(numberOfSpacePosts: string) {
    this._el.innerHTML = numberOfSpacePosts;
  }
}
