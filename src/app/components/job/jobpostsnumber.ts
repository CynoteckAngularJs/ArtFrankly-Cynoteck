import {Directive, ElementRef, Input} from 'angular2/core';
import {Subscription} from 'rxjs/Subscription';
import {AppService, IApp, DEFAULTS} from '../authentication/services/app-service';

/**
 * activeProfileJobPostsNumber
 */
@Directive({
  selector: '[activeprofilejobpostsnumber]'
})
export class ActiveProfileJobPostsNumber {
  _el: HTMLElement;
  activeProfileJobPosts$: Subscription<any>;

  constructor(
    el: ElementRef,
    public appSrv: AppService
  ) {
    this._el = el.nativeElement;

    this.activeProfileJobPosts$ = this.appSrv.$stream
      .map((state) => state.selectedProfileJobPosts)
      .subscribe((jobPosts) => this.onJobPostsSet(jobPosts));
  }

  ngOnDestroy() {
    this.activeProfileJobPosts$.unsubscribe();
  }

  onJobPostsSet(jobPosts = []) {
    this.updateJobPostNumber(jobPosts.length.toString());
  }

  private updateJobPostNumber(numberOfJobPosts: string) {
    this._el.innerHTML = numberOfJobPosts;
  }
}
