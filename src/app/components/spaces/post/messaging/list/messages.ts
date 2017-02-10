import {Component, Input, Output, EventEmitter, OnInit, OnDestroy} from 'angular2/core';
import {Subscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import {
  ROUTER_DIRECTIVES,
  Router,
  RouteParams,
  CanActivate
} from 'angular2/router';
import {
  FORM_DIRECTIVES,
  FormBuilder,
  Validators,
  Control,
  ControlGroup,
  NgClass,
  JsonPipe,
  AsyncPipe
} from 'angular2/common';
import {FormatDatePipe, SortByDatePipe} from '../../../../../url/pipes/pipes';
import {Utils} from '../../../../../url/utils/index';
import {SpacePostsService} from '../../../services/spaceposts-service';
import {MessagesService} from '../services/messages-service';
import {ISpacePost, SpacePostStorage, SpacePostModel} from '../../models';
import {AppService, IApp, DEFAULTS, ACTIONS} from '../../../../authentication/services/app-service';
import {ReplyDetails} from '../../reply/details/reply';
import {SpacePostReplyForm} from '../../reply/form/reply';
import {
  IProfileEditLD,
  IProfessionalGeneral,
  IInstitutionGeneral,
  IVendorGeneral,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel,
  BaseProfile
} from '../../../../profiles/models/profiles';
import {MessageModel} from '../models';
import {MessageDetails} from '../details/message';
import {MessageForm} from '../form/message';

@Component({
  selector: 'spacepost-reply-messages',
  directives: [
    ...FORM_DIRECTIVES,
    ...ROUTER_DIRECTIVES,
    NgClass,
    ReplyDetails,
    SpacePostReplyForm,
    MessageDetails,
    MessageForm
  ],
  providers: [MessagesService, SpacePostsService],
  pipes: [AsyncPipe, JsonPipe, FormatDatePipe, SortByDatePipe],
  styles: [require('./messages.css')],
  template: require('./messages.html')
})
// @CanActivate(checkIfHasPermission)
export class SpacePostReplyMessages implements OnInit, OnDestroy {
  @Input() spacepost: SpacePostModel = new SpacePostModel();
  @Input() spaceresponse: any;
  @Input() messages: MessageModel[];
  /* tslint:disable */
  @Input() profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel = new ProfileInstitutionModel();
  /* tslint:enable */
  selectedProfileDisposable: Subscription<any>;
  params: any = {};
  message: MessageModel = new MessageModel();
  showForm: boolean = true;
  noReply: boolean = false;

  constructor(
    private builder: FormBuilder,
    private router: Router,
    private routeParams: RouteParams,
    private spacePostsService: SpacePostsService,
    private messagesService: MessagesService,
    public appSrv: AppService
  ) {
    this.params.spaceId = this.routeParams.get('id');
    this.params.spaceresponseId = this.routeParams.get('spaceresponseId');
    this.selectedProfileDisposable = this.appSrv.$stream
      .map((state) => state.selectedProfile)
      .subscribe((profile) => {
        this.profile = profile;
      });
  }

  ngOnInit() {
    let isShowFormParam = !!JSON.parse(String( this.routeParams.get('showForm') ).toLowerCase());
    this.showForm = this.routeParams.get('showForm') ? isShowFormParam : true;
    let isNoReplyParam = !!JSON.parse(String( this.routeParams.get('noReply') ).toLowerCase());
    this.noReply = this.routeParams.get('noReply') ? isNoReplyParam : false;
    if (this.spacepost && this.spacepost.isNew()) {
      this.getSpacePost(this.params.spaceId);
    }
  }

  ngOnDestroy() {
    if (this.selectedProfileDisposable) {
      this.selectedProfileDisposable.unsubscribe();
    }
  }

  getSpacePost(id: string) {
    if (id) {
      this.spacePostsService.get(id).subscribe(
        (response: SpacePostModel) => {
          this.spacepost = response;
          let spaceresponses = response.deserializedSpaceResponses
            .filter((spaceresponse) => spaceresponse.id === this.params.spaceresponseId);
          this.spaceresponse = spaceresponses && spaceresponses.length && spaceresponses[0];
          if (this.spaceresponse) {
            this.getMessages();
          }
        },
        (error) => {
          // TODO: notification error
          console.log('ERROR ', error);
        }
      );
    }
  }

  getMessages() {
    let spaceresponseMessagesQuery = { spaceResponse: this.spaceresponse['@id'] };
    this.messagesService.query(spaceresponseMessagesQuery)
        .subscribe(
          (response: any) => {
            console.log('messages: ', response);
            this.messages = response['hydra:member'];
          },
          (error) => {
            console.log('Error retrieving messages!');
          }
        );
  }

  onMessageSaved($event) {
    console.log('onMessageSaved($event)', $event);
    this.resetForm();
    this.getMessages();
  }

  onUploadSuccess($event) {
    console.log('onUploadSuccess($event)', $event);
  }

  onShowForm($event) {
    $event.preventDefault();
    this.showForm = true;
  }

  private resetForm() {
    this.showForm = false;
    this.message = new MessageModel();
  }

  get _profile() {
    return this.spaceresponse &&
      (this.spaceresponse.hiringProfessional ||
      this.spaceresponse.hiringInstitution ||
      this.spaceresponse.hiringVendor || {});
  }

  get profileId() {
    let profile = this._profile;
    let id = profile && Utils.extractIdFromIRI(profile['@id']);
    return id;
  }

  get profileType() {
    let profile = this._profile;
    let id = profile && profile.type;
    return id;
  }

}
