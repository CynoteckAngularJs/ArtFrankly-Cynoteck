export interface ISignin {
  email: string;
  password: string;
}

export interface ISiginLD {
  _username: string;
  _password: string;
}

let defaultSigninModel = {
      _username: '',
      _password: '',
    };

export class SigninModel {
  constructor(public model: ISignin) {}

  serialize(signinModel: ISignin = this.model): ISiginLD {
    return {
      _username: signinModel.email,
      _password: signinModel.password,
    };
  }

  deserialize() {
  }
}
