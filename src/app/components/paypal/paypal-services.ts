import {Injectable} from 'angular2/core';
import {Observable} from 'rxjs/Observable';
import {
  Http,
  RequestOptionsArgs,
  Headers,
  Response,
  URLSearchParams
} from 'angular2/http';
import {API} from '../../config';
import {HttpProxy} from '../authentication/services/http-proxy';
import {IPaypal, PaypalModel, PaymentModel} from './models';
import {IJobPost, JobPostModel} from '../job/post/models';

/* tslint:disable */
/**
 * Paypal Payment flow:
 * 1. POST /job_postings/{id}/checkout
 *  Response (approvalUrl: https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-08P56282NB734244H)
 * 
 * 2. Redirect user to approvalUrl (paypal form)
 *  User is than depneding on action redirected to returnUrl or cancelUrl
 *  returnUrl: http://108.6.55.66:8981/#/confirm?paymentId=PAY-6RV70583SB702805EKEYSZ6Y&token=EC-60U79048BN7719609&PayerID=7E7MGXCWTTKK2
 * 
 * 3. returnUrl is handled by (not showing anything just) doing an API call to 
 *  POST /job_postings/{id}/execute W payload = {PayerID: 7E7MGXCWTTKK2}
 *  Response: OK W jobpost that was payed -> Show info to the user!
 */
/* tslint:enable */
@Injectable()
export class PaypalService {
  constructor(public http: HttpProxy) {}

  getPaymentInfo(payload: IPaypal): Observable<JobPostModel> {
    let URL = [API.JOB_POSINGS, payload.paymentId, payload.PayerID, 'execute'].join('/');
    let _payload = { PayerID: payload.PayerID };
    let _observable = this.http.post(URL, JSON.stringify(_payload));
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = new JobPostModel(response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }

  getInfoByToken(token: string) {
    let URL = [API.JOB_POSINGS, token, 'cancelled'].join('/');
    let _observable = this.http.get(URL);
    return new Observable((observer) => {
      _observable.subscribe(
        (response) => {
          let _response = new PaymentModel(response);
          observer.next(_response);
        },
        (error) => observer.error(error),
        () => observer.complete()
      );
    });
  }
}
