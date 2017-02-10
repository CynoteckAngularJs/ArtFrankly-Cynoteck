import {
  Component,
  Input,
  Output
} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, NgSwitchDefault} from 'angular2/common';
import {PROFILE_SUBMODEL_TYPES} from '../../../constants';
import {IProfileEditLD, ProfileEditLDModel} from '../models/profiles';
import {HonorForms} from '../../honors/list/honors';
import {EventForms} from '../../events/list/events';
import {EducationForms} from '../../educations/list/educations';
import {LicenseForms} from '../../licenses/list/licenses';
import {ProjectForms} from '../../projects/list/projects';
import {ArtistForms} from '../../artists/list/artists';
import {ExperienceForms} from '../../experiences/list/experiences';
import {PhotoAndVideoForms} from '../../photosandvideos/list/photosandvideos';
import {DescriptionForm} from './description/description';
import {LanguagesForm} from './languages/languages';
import {SkillsForm} from './skills/skills';
import {SpecialitiesForm} from './specialities/specialities';
import {PeriodsForm} from './periods/periods';
import {ArtworkForms} from '../../artworks/list/artworks';

@Component({
  selector: 'profile-submodel-form',
  directives: [
    NgSwitch,
    NgSwitchWhen,
    NgSwitchDefault,
    HonorForms,
    EventForms,
    EducationForms,
    LicenseForms,
    ProjectForms,
    ArtistForms,
    DescriptionForm,
    LanguagesForm,
    SkillsForm,
    SpecialitiesForm,
    PeriodsForm,
    ExperienceForms,
    PhotoAndVideoForms,
    ArtworkForms
  ],
  template: require('./submodel.html')
})
export class Submodel {
  @Input() submodeltype: string;
  @Input() profile: IProfileEditLD = new ProfileEditLDModel();
  SUBMODEL_TYPES: any = PROFILE_SUBMODEL_TYPES;

  constructor() {
  }

}
