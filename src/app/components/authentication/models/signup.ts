export interface ISignup {
  firstname?: string;
  lastname?: string;
  profileType: string;
  name?: string;
  email: string;
  password: string;
}

export interface ISignupLD {
  givenName?: string;
  familyName?: string;
  email: string;
  password: string;
  profileType: string;
}

export const defaultSignupModel = {
      email: '',
      password: '',
      profileType: ''
    };

export class SignupModel {
  constructor(public model: ISignup = defaultSignupModel) {}

  serialize(signupModel: ISignup = this.model): ISignupLD {
    return {
      givenName: signupModel.firstname,
      familyName: signupModel.lastname,
      email: signupModel.email,
      password: signupModel.password,
      profileType: signupModel.profileType
    };
  }

  deserialize() {}
}
