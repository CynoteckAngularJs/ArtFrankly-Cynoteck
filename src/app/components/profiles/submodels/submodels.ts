import {
  Component,
  Input,
  Output,
  OnChanges
} from 'angular2/core';
import {ROUTER_DIRECTIVES, Router, RouteParams, Location, CanActivate} from 'angular2/router';
import {NgSwitch, NgSwitchWhen, NgSwitchDefault} from 'angular2/common';
import {PROFILE_SUBMODEL_TYPES} from '../../../constants';
import {
  IProfileEditLD,
  ProfileEditLDModel,
  ProfileInstitutionModel,
  ProfileVendorModel,
  ProfileProfessionalModel
} from '../models/profiles';
import {HonorForms} from '../../honors/list/honors';
import {EventForms} from '../../events/list/events';
import {EducationForms} from '../../educations/list/educations';
import {LicenseForms} from '../../licenses/list/licenses';
import {ProjectForms} from '../../projects/list/projects';
import {ExperienceForms} from '../../experiences/list/experiences';
import {PhotoAndVideoForms} from '../../photosandvideos/list/photosandvideos';
import {ArtworkForms} from '../../artworks/list/artworks';
import {Submodel} from './submodel';

@Component({
  selector: 'profile-submodel-forms',
  directives: [
    Submodel
  ],
  styles: [require('./submodels.css')],
  template: require('./submodels.html')
})
export class SubmodelForms implements OnChanges {
  @Input() submodeltype: string;
  @Input() profile: ProfileInstitutionModel|ProfileVendorModel|ProfileProfessionalModel;
  SUBMODEL_TYPES: any = PROFILE_SUBMODEL_TYPES;
  submodelsConfig: any = {
      professional: {
        selected: [
          PROFILE_SUBMODEL_TYPES.educations,
          PROFILE_SUBMODEL_TYPES.photosAndVideos,
          PROFILE_SUBMODEL_TYPES.artworks,
          PROFILE_SUBMODEL_TYPES.experiences,
          PROFILE_SUBMODEL_TYPES.description,
          PROFILE_SUBMODEL_TYPES.skills,
          PROFILE_SUBMODEL_TYPES.specialities,
          PROFILE_SUBMODEL_TYPES.languages
        ],
        all: [
          PROFILE_SUBMODEL_TYPES.educations,
          PROFILE_SUBMODEL_TYPES.photosAndVideos,
          PROFILE_SUBMODEL_TYPES.artworks,
          PROFILE_SUBMODEL_TYPES.experiences,
          PROFILE_SUBMODEL_TYPES.description,
          PROFILE_SUBMODEL_TYPES.skills,
          PROFILE_SUBMODEL_TYPES.specialities,
          PROFILE_SUBMODEL_TYPES.languages,
          PROFILE_SUBMODEL_TYPES.artists,
          PROFILE_SUBMODEL_TYPES.honorsAndAwards,
          PROFILE_SUBMODEL_TYPES.licenseAndCertification,
          PROFILE_SUBMODEL_TYPES.events,
          PROFILE_SUBMODEL_TYPES.period,
        ],
        unselected: undefined
      },
      institution: {
        selected: [
          PROFILE_SUBMODEL_TYPES.photosAndVideos,
          PROFILE_SUBMODEL_TYPES.artworks,
          PROFILE_SUBMODEL_TYPES.description,
          PROFILE_SUBMODEL_TYPES.period,
          PROFILE_SUBMODEL_TYPES.languages,
          PROFILE_SUBMODEL_TYPES.artists,
          PROFILE_SUBMODEL_TYPES.events
        ],
        all: [
          PROFILE_SUBMODEL_TYPES.photosAndVideos,
          PROFILE_SUBMODEL_TYPES.artworks,
          PROFILE_SUBMODEL_TYPES.description,
          PROFILE_SUBMODEL_TYPES.period,
          PROFILE_SUBMODEL_TYPES.languages,
          PROFILE_SUBMODEL_TYPES.artists,
          PROFILE_SUBMODEL_TYPES.events,
          PROFILE_SUBMODEL_TYPES.honorsAndAwards,
          PROFILE_SUBMODEL_TYPES.licenseAndCertification
        ],
        unselected: undefined
      },
      vendor: {
        selected: [
          PROFILE_SUBMODEL_TYPES.photosAndVideos,
          PROFILE_SUBMODEL_TYPES.artworks,
          PROFILE_SUBMODEL_TYPES.description,
          PROFILE_SUBMODEL_TYPES.languages,
          PROFILE_SUBMODEL_TYPES.specialities,
          PROFILE_SUBMODEL_TYPES.artists,
          PROFILE_SUBMODEL_TYPES.events
        ],
        all: [
          PROFILE_SUBMODEL_TYPES.photosAndVideos,
          PROFILE_SUBMODEL_TYPES.artworks,
          PROFILE_SUBMODEL_TYPES.description,
          PROFILE_SUBMODEL_TYPES.languages,
          PROFILE_SUBMODEL_TYPES.specialities,
          PROFILE_SUBMODEL_TYPES.artists,
          PROFILE_SUBMODEL_TYPES.events,
          PROFILE_SUBMODEL_TYPES.honorsAndAwards,
          PROFILE_SUBMODEL_TYPES.licenseAndCertification
        ],
        unselected: undefined
      },
    };

  constructor() {
    this.recalculateUnselected();
  }

  ngOnChanges(changes) {
    if (changes.profile &&
        changes.profile.currentValue.type !== changes.profile.previousValue.type
    ) {
      this.recalculateUnselected();
    }
  }

  recalculateUnselected() {
    let profileTypes = Object.keys(this.submodelsConfig);
    profileTypes.forEach((profileType) => {
      this.submodelsConfig[profileType].unselected = this.getUnselected(profileType);
    });
  }

  getUnselected(profileType: string) {
    var unselectedForType = [];
    if (this.submodelsConfig[profileType]) {
      unselectedForType = this.submodelsConfig[profileType].all
        .filter(this.notInSelected(profileType).bind(this));
    }
    return unselectedForType;
  }

  get additionalSubmodels() {
    let additionalSubmodels = [];
    let profileType = this.profile.type;
    if (this.profile.isTypeAllowed()) {
      additionalSubmodels = this.submodelsConfig[profileType].all
        .filter(this.notInSelected(profileType).bind(this));
    }
    return additionalSubmodels;
  }

  addSubmodel($event, submodel: string) {
    $event.preventDefault();
    if (this.profile.isTypeAllowed()) {
      this.submodelsConfig[this.profile.type].selected.push(submodel);
      this.recalculateUnselected();
    }
  }

  private notInSelected(profileType: string) {
    return (submodelType: string) => {
      return this.submodelsConfig[profileType].selected.indexOf(submodelType) < 0;
    };
  }
}
