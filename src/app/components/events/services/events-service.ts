import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {API} from '../../../config';
import {Utils, ArrayUtils} from '../../../url/utils/index';
import {HttpProxy} from '../../authentication/services/http-proxy';
import {IEvent, EventModel} from '../models';

export interface IProfileEvents {
  profile: string;
  events: EventModel[];
}

export class ProfileEventsModel {
  constructor(public profile: string = '', public events: EventModel[] = []) {
    if (!profile || !profile.trim().length) {
      throw new Error('Profile is required, but not provided!');
    }
  }
}

export class ProfileEventsList {
  constructor(public data: ProfileEventsModel[] = [] ) {}

  findIndex(profile: string) {
    return this.data.findIndex((item: ProfileEventsModel) => item.profile === profile);
  }

  findByProfile(profile: string): ProfileEventsModel {
    return this.data.find((item: ProfileEventsModel) => item.profile === profile);
  }

  profileEvents(profile: string): EventModel[] {
    let profileEvent: ProfileEventsModel = this.findByProfile(profile);
    return profileEvent && profileEvent.events || [];
  }

  /**
   * Method used to set (push or update) profile events.
   * If profile is not already found within data array it will push new item to data array.
   * Otherwise it will find and replace existing profile events item with new one.
   */
  setProfileEvents(profileEvents: ProfileEventsModel) {
    let index = this.findIndex(profileEvents.profile);
    if (index < 0) { // Not found in data
      this.data.push(profileEvents);
    } else { // Found in data
      // Update the item on provided index with new one
      this.data = [...this.data].map((item: ProfileEventsModel, cindex: number) => {
          return cindex === index ? profileEvents : item;
        });
    }
  }

  addEvent(event: EventModel) {
    let profileEvents: ProfileEventsModel = this.findByProfile(event.profile);
    if (!profileEvents) {
      profileEvents = new ProfileEventsModel(event.profile);
    }
    profileEvents.events = [...profileEvents.events, event];
    this.setProfileEvents(profileEvents);
  }

  updateEvent(event: EventModel) {
    let profileEvents: ProfileEventsModel = this.findByProfile(event.profile);
    if (profileEvents && profileEvents.events) {
      profileEvents.events = ArrayUtils.update(profileEvents.events, event);
      this.setProfileEvents(profileEvents);
    }
  }

  removeEvent(event: EventModel) {
    let profileEvents: ProfileEventsModel = this.findByProfile(event.profile);
    profileEvents.events = ArrayUtils.remove(profileEvents.events, event);
    this.setProfileEvents(profileEvents);
  }
}

export interface IEventQuery {
  profile: string;
}

@Injectable()
export class EventsService {
  public $stream: BehaviorSubject<ProfileEventsList>;
  private _observer: any;
  // Application state representation
  private state: ProfileEventsList = new ProfileEventsList();

  constructor(public http: HttpProxy) {
    this.state = new ProfileEventsList();
    this.$stream = new BehaviorSubject(this.state);
  }

  query(query: IEventQuery): Observable<EventModel[]> {
    let _observable = this.http.get(API.EVENTS, { search: Utils.toUrlParams(query) });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = this.setEvents(query.profile, response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // get(id: string, query?: any): Observable<HonorModel> {
  //   let URL = [API.EVENTS, id].join('/');
  //   let _observable = this.http.get(URL, { search: Utils.toUrlParams(query) });
  //   return new Observable((observer) => {
  //     _observable.subscribe(
  //       (response) => {
  //         let honor = new HonorModel(response);
  //         observer.next(honor);
  //       },
  //       (error) => observer.error(error),
  //       () => observer.complete()
  //     );
  //   });
  // }

  save(event: EventModel): Observable<EventModel> {
    let payload = event.serialize();
    let _observable = this.http.post(API.EVENTS, JSON.stringify(payload));
    console.log('this.state ', this.state);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: event.merge(response: IEvent) instead of below line!
          event['@id'] = response['@id'];
          console.log('this.state ', this.state);
          this.state.addEvent(event);
          this.setState(this.state);
          observer.next(event);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(event: EventModel): Observable<EventModel> {
    let payload = event.serialize();
    let _observable = this.http.put(API.BASE + event['@id'], JSON.stringify(payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          // TODO: event.merge(response: IEvent)
          this.state.updateEvent(event);
          this.setState(this.state);
          observer.next(event);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  delete(event: EventModel): Observable<EventModel> {
    let _observable = this.http.delete(API.BASE + event['@id']);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          this.state.removeEvent(event);
          this.setState(this.state);
          observer.next(event);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  /**
   * Method setting newly calculated data and notifying observers.
   * To be overridden by extended classes
   */
  private setState(state: ProfileEventsList = new ProfileEventsList()) {
    let newState = Object.assign(new ProfileEventsList(), state);
    this.state = newState;
    this.$stream.next(newState);
    return newState;
  }

  private setEvents(profile: string, response) {
    let _response = Object.assign({}, response);
    _response['hydra:member'] = [...response['hydra:member']]
      .map((event: IEvent) => new EventModel(Object.assign({}, { profile: profile }, event)));
    this.state.setProfileEvents(new ProfileEventsModel(profile, _response['hydra:member']));
    this.setState(this.state);
    return _response;
  }

}
