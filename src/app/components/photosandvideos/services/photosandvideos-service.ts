// import {Injectable} from 'angular2/core';
// import {Observable} from 'rxjs/Observable';
// import {BehaviorSubject} from 'rxjs';
// import {
//   Http,
//   RequestOptionsArgs,
//   Headers,
//   Response,
//   URLSearchParams
// } from 'angular2/http';
// import {API} from '../../../config';
// import {Utils, ArrayUtils} from '../../../url/utils/index';
// import {HttpProxy} from '../../authentication/services/http-proxy';
// import {ILicense, LicenseModel} from '../models';

// export interface IProfileLicenses {
//   profile: string;
//   licenses: LicenseModel[];
// }

// export class ProfileLicensesModel {
//   constructor(public profile: string = '', public licenses: LicenseModel[] = []) {
//     if (!profile || !profile.trim().length) {
//       throw new Error('Profile is required, but not provided!');
//     }
//   }
// }

// export class ProfileLicensesList {
//   constructor(public data: ProfileLicensesModel[] = [] ) {}

//   findIndex(profile: string) {
//     return this.data.findIndex((item: ProfileLicensesModel) => item.profile === profile);
//   }

//   findByProfile(profile: string): ProfileLicensesModel {
//     return this.data.find((item: ProfileLicensesModel) => item.profile === profile);
//   }

//   profileLicenses(profile: string): LicenseModel[] {
//     let profileLicense: ProfileLicensesModel = this.findByProfile(profile);
//     return profileLicense && profileLicense.licenses || [];
//   }

//   /**
//    * Method used to set (push or update) profile licenses.
//    * If profile is not already found within data array it will push new item to data array.
//    * Otherwise it will find and replace existing profile licenses item with new one.
//    */
//   setProfileLicenses(profileLicenses: ProfileLicensesModel) {
//     let index = this.findIndex(profileLicenses.profile);
//     if (index < 0) { // Not found in data
//       this.data.push(profileLicenses);
//     } else { // Found in data
//       // Update the item on provided index with new one
//       this.data = [...this.data].map((item: ProfileLicensesModel, cindex: number) => {
//           return cindex === index ? profileLicenses : item;
//         });
//     }
//   }

//   addLicense(license: LicenseModel) {
//     let profileLicenses: ProfileLicensesModel = this.findByProfile(license.profile);
//     profileLicenses.licenses = [...profileLicenses.licenses, license];
//     this.setProfileLicenses(profileLicenses);
//   }

//   updateLicense(license: LicenseModel) {
//     let profileLicenses: ProfileLicensesModel = this.findByProfile(license.profile);
//     profileLicenses.licenses = ArrayUtils.update(profileLicenses.licenses, license);
//     this.setProfileLicenses(profileLicenses);
//   }

//   removeLicense(license: LicenseModel) {
//     let profileLicenses: ProfileLicensesModel = this.findByProfile(license.profile);
//     profileLicenses.licenses = ArrayUtils.remove(profileLicenses.licenses, license);
//     this.setProfileLicenses(profileLicenses);
//   }
// }

// export interface ILicenseQuery {
//   profile: string;
// }

// @Injectable()
// export class LicensesService {
//   public $stream: BehaviorSubject<ProfileLicensesList>;
//   private _observer: any;
//   // Application state representation
//   private state: ProfileLicensesList = new ProfileLicensesList();

//   constructor(public http: HttpProxy) {
//     this.state = new ProfileLicensesList();
//     this.$stream = new BehaviorSubject(this.state);
//   }

//   query(query: ILicenseQuery): Observable<LicenseModel[]> {
//     let _observable = this.http.get(API.LICENSES, { search: Utils.toUrlParams(query) });
//     return new Observable((observer) => {
//       _observable.subscribe(
//         (response) => {
//           let _response = this.setLicenses(query.profile, response);
//           observer.next(_response);
//         },
//         (error) => observer.error(error),
//         () => observer.complete()
//       );
//     });
//   }

//   // get(id: string, query?: any): Observable<HonorModel> {
//   //   let URL = [API.LICENSES, id].join('/');
//   //   let _observable = this.http.get(URL, { search: Utils.toUrlParams(query) });
//   //   return new Observable((observer) => {
//   //     _observable.subscribe(
//   //       (response) => {
//   //         let honor = new HonorModel(response);
//   //         observer.next(honor);
//   //       },
//   //       (error) => observer.error(error),
//   //       () => observer.complete()
//   //     );
//   //   });
//   // }

//   save(license: LicenseModel): Observable<LicenseModel> {
//     let payload = license.serialize();
//     let _observable = this.http.post(API.LICENSES, JSON.stringify(payload));
//     return new Observable((observer) => {
//       _observable.subscribe(
//         (response) => {
//           // TODO: license.merge(response: ILicense) instead of below line!
//           license['@id'] = response['@id'];
//           this.state.addLicense(license);
//           this.setState(this.state);
//           observer.next(license);
//         },
//         (error) => observer.error(error),
//         () => observer.complete()
//       );
//     });
//   }

//   update(license: LicenseModel): Observable<LicenseModel> {
//     let payload = license.serialize();
//     let _observable = this.http.put(API.BASE + license['@id'], JSON.stringify(payload));
//     return new Observable((observer) => {
//       _observable.subscribe(
//         (response) => {
//           // TODO: license.merge(response: ILicense)
//           this.state.updateLicense(license);
//           this.setState(this.state);
//           observer.next(license);
//         },
//         (error) => observer.error(error),
//         () => observer.complete()
//       );
//     });
//   }

//   delete(license: LicenseModel): Observable<LicenseModel> {
//     let _observable = this.http.delete(API.BASE + license['@id']);
//     return new Observable((observer) => {
//       _observable.subscribe(
//         (response) => {
//           this.state.removeLicense(license);
//           this.setState(this.state);
//           observer.next(license);
//         },
//         (error) => observer.error(error),
//         () => observer.complete()
//       );
//     });
//   }

//   /**
//    * Method setting newly calculated data and notifying observers.
//    * To be overridden by extended classes
//    */
//   private setState(state: ProfileLicensesList = new ProfileLicensesList()) {
//     let newState = Object.assign(new ProfileLicensesList(), state);
//     this.state = newState;
//     this.$stream.next(newState);
//     return newState;
//   }

//   private setLicenses(profile: string, response) {
//     let _response = Object.assign({}, response);
//     _response['hydra:member'] = [...response['hydra:member']]
//       .map((license: ILicense) => new LicenseModel(license));
//     this.state.setProfileLicenses(new ProfileLicensesModel(profile, _response['hydra:member']));
//     this.setState(this.state);
//     return _response;
//   }

// }
