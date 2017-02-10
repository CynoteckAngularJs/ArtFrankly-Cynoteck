import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {API} from '../../../config';
import {HttpProxy} from '../../authentication/services/http-proxy';
import {IJobPost, JobPostModel} from '../post/models';
import {JobPostReplyModel, IJobPostReply} from '../post/reply/models';

const DEFAULT_ADDRESS: any = {
      '@type': 'http://schema.org/Place',
      address: {
        '@type': 'http://schema.org/PostalAddress'
      }
    };

@Injectable()
export class JobPostsService {
  amount: number;

  constructor(public http: HttpProxy) {}

  get(id: string): Observable<JobPostModel> {
    let _observable = this.http.get([API.JOB_POSINGS, id].join('/'));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(new JobPostModel(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // /job_postings?hiringInstitution=2
  myJobPosts(profileFieldType, profileFieldValue): Observable<JobPostModel[]> {
    var params = new URLSearchParams();
    params.set(profileFieldType, profileFieldValue);
    let _observable = this.http.get(API.JOB_POSINGS, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((jobpost: IJobPost) => new JobPostModel(jobpost));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  // /job_postings?hiringInstitution=2
  myPublishedJobPosts(profileFieldType, profileFieldValue): Observable<JobPostModel[]> {
    var params = new URLSearchParams();
    params.set(profileFieldType, profileFieldValue);
    params.set('state', 'published');
    let _observable = this.http.get(API.JOB_POSINGS, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((jobpost: IJobPost) => new JobPostModel(jobpost));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  myJobPostsResponses(query: any = {}): Observable<JobPostReplyModel[]>  {
    var params = new URLSearchParams();
    Object.keys(query).forEach((key) => params.set(key, query[key]));
    let _observable = this.http.get(API.JOBRESPONSES, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((jobpostreply: IJobPostReply) => {
              jobpostreply.jobPosting = new JobPostModel(jobpostreply.jobPosting);
              return new JobPostReplyModel(jobpostreply);
            });
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  profileArchivedJobPosts(profileIri: string) {
    // ?state=archived&profile=/professionals/2
    return this.query({
      state: 'archived',
      profile: profileIri
    });
  }

  query(query: any = {}) {
    var params = new URLSearchParams();
    Object.keys(query).forEach((key) => params.set(key, query[key]));
    let _observable = this.http.get(API.JOB_POSINGS, { search: params });
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = Object.assign({}, response);
          _response['hydra:member'] = response['hydra:member']
            .map((jobpost: IJobPost) => new JobPostModel(jobpost));
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  save(jobPost: IJobPost = {}): Observable<JobPostModel> {
    jobPost.jobLocation = jobPost.jobLocation  ||
      Object.assign({}, DEFAULT_ADDRESS);
    jobPost.contactLocation = jobPost.contactLocation  ||
      Object.assign({}, DEFAULT_ADDRESS);

    delete jobPost.id;
    delete jobPost['@id'];
    delete jobPost.contactLocation['@id'];
    delete jobPost.contactLocation.address['@id'];
    delete jobPost.jobLocation['@id'];
    delete jobPost.jobLocation.address['@id'];

    let _observable = this.http.post(API.JOB_POSINGS, JSON.stringify(jobPost));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          observer.next(new JobPostModel(response));
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  update(jobPost: IJobPost = {}): Observable<JobPostModel> {
    // jobPost.jobLocation = jobPost.jobLocation  || { address: {} };
    // jobPost.contactLocation = jobPost.contactLocation || { address: {} };
    let _observable = this.http.put(API.BASE + jobPost['@id'], JSON.stringify(jobPost));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          observer.next(new JobPostModel(response));
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  archive(id: string) {
    let URL = [API.JOB_POSINGS, id, 'archive'].join('/');
    return this.http.get(URL);
  }

  /* tslint:disable */
  /**
   * 1. POST /job_postings/{id}/checkout
   *  Response (approvalUrl: https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-08P56282NB734244H)
   * approvalUrl should be used for redirecting user to it (paypal form)
   */
  /* tslint:enable */
  checkoutPayPal(id: string): Observable<{ approvalUrl: string }> {
    let URL = [API.JOB_POSINGS, id, 'checkoutPayPal'].join('/');
    return this.http.post(URL, '');
  }

  checkoutStripe(jobPostId: string, tokenId: string, amount: number):
      Observable<{ approvalUrl: string }> {
    let URL = [API.JOB_POSINGS, jobPostId, 'checkoutStripe', tokenId, amount].join('/');
    return this.http.post(URL, '');
  }

  getLastPayment(jobPostId: string): Observable<{ approvalUrl: string }> {
    let URL = [API.JOB_POSINGS, jobPostId, 'last_payment'].join('/');
    return this.http.get(URL);
  }

  execute(id: string) {
    let URL = [API.JOB_POSINGS, id, 'execute'].join('/');
    return this.http.post(URL, '');
  }

  publish(id: string) {
    let URL = [API.JOB_POSINGS, id, 'direct_publish'].join('/');
    return this.http.post(URL, '');
  }

  setAmount(amount: number) {
      this.amount = amount;
  }

  getAmount() {
      return this.amount;
  }

}
