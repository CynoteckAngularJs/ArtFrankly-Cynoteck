import {API_PORT, API_BASE_URL} from './api_server';
export const BASE: string = `http://${API_BASE_URL}:${API_PORT}`;
//export const BASE: string = `http://${API_BASE_URL}`;	
export const SIGNUP: string = `${BASE}/signup`;
export const REFRESH_TOKEN: string = `${BASE}/refresh`;
export const SIGNIN: string = `${BASE}/signin`;
export const PROFILES: string = `${BASE}/profiles`;
export const MYPROFILES: string = `${BASE}/me/profile`;
export const VENDORS: string = `${BASE}/vendors`;
export const INSTITUTIONS: string = `${BASE}/institutions`;
export const PROFESSIONALS: string = `${BASE}/professionals`;
export const JOB_POSINGS: string = `${BASE}/job_postings`;
export const FEEDS: string = `${BASE}/feed`;
export const HONORS: string = `${BASE}/honors`;
export const EVENTS: string = `${BASE}/events`;
export const EDUCATIONS: string = `${BASE}/educations`;
export const EXPERIENCES: string = `${BASE}/experiences`;
export const LICENSES: string = `${BASE}/licenses`;
export const PROJECTS: string = `${BASE}/projects`;
export const ARTISTS: string = `${BASE}/artists`;
export const UPLOADS: string = `${BASE}/uploads`;
export const ARTWORKS: string = `${BASE}/artworks`;
export const JOBPOST_RESPONSES: string = `${BASE}/job_responses`;
export const MESSAGES: string = `${BASE}/messages`;
export const JOBRESPONSES: string = `${BASE}/responses_to_posts`;
export const SEARCH: string = `${BASE}/search`;
export const REQUEST_RESET: string = `${BASE}/send-email`;
export const VERIFY_COMPLEXITY: string = `${BASE}/validate-password`;
export const VERIFY_TOKEN: string = `${BASE}/verify-token`;
export const RESET_PASSWORD: string = `${BASE}/reset`;
export const CHANGE_PASSWORD: string = `${BASE}/change-password`;

export const SPACE_POSINGS: string = `${BASE}/space_postings`;
export const SPACEPOST_RESPONSES: string = `${BASE}/space_responses`;
export const SPACERESPONSES: string = `${BASE}/responses_to_posts`;


export const API = {
  BASE,
  SIGNUP,
  SIGNIN,
  REFRESH_TOKEN,
  PROFILES,
  MYPROFILES,
  VENDORS,
  INSTITUTIONS,
  PROFESSIONALS,
  JOB_POSINGS,
  FEEDS,
  HONORS,
  EVENTS,
  EDUCATIONS,
  EXPERIENCES,
  LICENSES,
  PROJECTS,
  ARTISTS,
  UPLOADS,
  ARTWORKS,
  JOBPOST_RESPONSES,
  MESSAGES,
  JOBRESPONSES,
  SEARCH,
  REQUEST_RESET,
  VERIFY_COMPLEXITY,
  VERIFY_TOKEN,
  RESET_PASSWORD,
  CHANGE_PASSWORD,

  SPACE_POSINGS,
  SPACEPOST_RESPONSES,
  SPACERESPONSES,
};


export const DATE_FORMAT: string = 'MM/DD/YYYY';
export const DATE_TIME_FORMAT: string = 'MM/DD/YYYY h:mm a';


export const INTERCOM_API_ID: string = 'kki63r2r';
// export const STRIPE_PK: string = 'pk_test_yIV5NmbkIjthwtEaCHTw3czY';
export const STRIPE_PK: string = 'pk_live_15DMExqlu3dtH9eWKRa2lI6d';
