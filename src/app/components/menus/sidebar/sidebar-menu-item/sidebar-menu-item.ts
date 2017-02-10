import {Component, Input, Output, EventEmitter, OnInit, ViewEncapsulation} from 'angular2/core';
import {FORM_DIRECTIVES, JsonPipe} from 'angular2/common';
import {ROUTER_DIRECTIVES, Router, RouteParams} from 'angular2/router';
import {ActiveProfileJobPostsNumber} from '../../../job/jobpostsnumber';
import {JobPostsService} from '../../../job/services/jobposts-service';
import {IJobPost, JobPostModel} from '../../../job/post/models';



export interface ISidebarMenuItem {
  id?: string;
  expandable?: boolean;
  expanded?: boolean;
  name?: string;
  icon?: string;
  url?: string;
  linkParams?: any[];
  children?: ISidebarMenuItem[];
}

export const DEFAULTS = {
  id: undefined,
  expandable: true,
  expanded: false,
  name: undefined,
  url: undefined,
  linkParams: [],
  children: []
};

export class SidebarMenuItemModel implements ISidebarMenuItem {
  id: string;
  expandable: boolean;
  expanded: boolean;
  name: string;
  linkParams: any[];
  url: string;
  children: ISidebarMenuItem[] = [];

  constructor(
    attributes: ISidebarMenuItem = {}
  ) {
    Object.assign(this, DEFAULTS, attributes);
    this.children = this.childrenToModel([...this.children]);
    return this;
  }

  childrenToModel(children: ISidebarMenuItem[] = []): SidebarMenuItemModel[] {
    let toModel = (item) => new SidebarMenuItemModel(Object.assign({}, DEFAULTS, item));
    return children.map((child) => {
      return toModel(child);
    });
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }

  _find(menuId): SidebarMenuItemModel {
    let found = undefined;
    let recoursiveFind = (menuId, menuModel) => {
        let found;
        if (menuModel.id === menuId) {
          found = menuModel;
        } else if (menuModel.children.length) {
          for (var index = 0; index < menuModel.children.length; index++) {
            found = recoursiveFind(menuId, menuModel.children[index]);
            if (found) {
              break;
            }
          }
        }
        return found;
      };
    return recoursiveFind(menuId, this);
  }

  find(menuId: string): SidebarMenuItemModel {
    return this._find(menuId);
  }
}

@Component({
  selector: 'sidebar-menu-item',
  directives: [
    ...FORM_DIRECTIVES,
    ...ROUTER_DIRECTIVES,
    SidebarMenuItem,
    ActiveProfileJobPostsNumber,
  ],
  pipes: [JsonPipe],
  providers: [JobPostsService],
  styles: [ require('./sidebar-menu-item.css') ],
  template: require('./sidebar-menu-item.html'),
  encapsulation: ViewEncapsulation.None
})
export class SidebarMenuItem implements OnInit {
  @Input() menu: SidebarMenuItemModel = new SidebarMenuItemModel(Object.assign({}, DEFAULTS));
  @Input() jobposts: JobPostModel[] = [];
  @Output() toggled: EventEmitter<any> = new EventEmitter();

  constructor(private router: Router) {}

  ngOnInit() {}

  toggle($event) {
    if (!this.menu.url) {
      $event.preventDefault();
    }
    if (this.menu.children.length) {
      this.menu.toggle();
      this.toggled.next(this.menu);
    } else if (this.menu.linkParams && this.menu.linkParams.length) {
      this.router.navigate(this.menu.linkParams);
      // this.router.navigateByUrl(this.menu.url);
    }
  }
}
