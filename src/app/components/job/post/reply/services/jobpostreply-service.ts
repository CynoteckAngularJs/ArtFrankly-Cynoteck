import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {API} from '../../../../../config';
import {HttpProxy} from '../../../../authentication/services/http-proxy';
import {IJobPostReply, JobPostReplyModel} from '../models';

@Injectable()
export class JobPostReplyService {
  constructor(public http: HttpProxy) {}

  get(id: string): Observable<JobPostReplyModel> {
    let _observable = this.http.get([API.JOBPOST_RESPONSES, id].join('/'));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => observer.next(new JobPostReplyModel(response)),
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  save(jobPost: IJobPostReply): Observable<JobPostReplyModel> {
    return this.http.post(API.JOBPOST_RESPONSES, JSON.stringify(jobPost));
  }

  update(jobPost: IJobPostReply): Observable<IJobPostReply> {
    return this.http.put(API.BASE + jobPost['@id'], JSON.stringify(jobPost));
  }
}
