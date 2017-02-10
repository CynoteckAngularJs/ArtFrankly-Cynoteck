/*
 * Providers provided by Angular
 */
import {provide} from 'angular2/core';
import {bootstrap, ELEMENT_PROBE_PROVIDERS} from 'angular2/platform/browser';
import {ROUTER_PROVIDERS, LocationStrategy, HashLocationStrategy} from 'angular2/router';
import {HTTP_PROVIDERS} from 'angular2/http';
import {HttpProxy, HttpWrapper} from './app/components/authentication/services/http-proxy';
import {AppService} from './app/components/authentication/services/app-service';
import {
  TokenManager,
  JwtTokenHelper
} from './app/components/authentication/services/token-manager-service';
import {ProfilesService} from './app/components/profiles/services/profiles-service';
import {NotificationsCollection} from './app/components/notifications/services/notifications';
import {appInjector} from './app/appinjector';
import {EventsService} from './app/components/events/services/events-service';
import {EducationsService} from './app/components/educations/services/educations-service';
import {HonorsService} from './app/components/honors/services/honors-service';
import {EducationsFormList} from './app/components/educations/list/educations';
import {LicensesService} from './app/components/licenses/services/licenses-service';
import {ProjectsService} from './app/components/projects/services/projects-service';
import {ArtistsService} from './app/components/artists/services/artists-service';
import {ExperiencesService} from './app/components/experiences/services/experiences-service';
import {UploadsService} from './app/components/af-uploader/services/uploads-service';
import {ArtworksService} from './app/components/artworks/services/artworks-service';
import { ProfileIdService } from './app/components/projects/services/projects-service';

/*
 * App Component
 * our top level component that holds all of our components
 */
import {App} from './app/app';
/*
 * Bootstrap our Angular app with a top level component `App` and inject
 * our Services and Providers into Angular's dependency injection
 */
import {enableProdMode} from 'angular2/core';
enableProdMode();
document.addEventListener('DOMContentLoaded', function main() {
  bootstrap(App, [
    ...('production' === process.env.ENV ? [] : ELEMENT_PROBE_PROVIDERS),
    ...HTTP_PROVIDERS,
    ...ROUTER_PROVIDERS,
   // provide(LocationStrategy, { useClass: HashLocationStrategy }),
    HttpWrapper,
    HttpProxy,
    TokenManager,
    JwtTokenHelper,
    ProfilesService,
    NotificationsCollection,
    AppService,
    EventsService,
    EducationsService,
    HonorsService,
    LicensesService,
    ProjectsService,
    ArtistsService,
    ExperiencesService,
    EducationsFormList,
    UploadsService,
    ArtworksService,
    ProfileIdService
  ])
  .then((appRef) => appInjector(appRef.injector))
  .catch(err => console.error(err));
});
