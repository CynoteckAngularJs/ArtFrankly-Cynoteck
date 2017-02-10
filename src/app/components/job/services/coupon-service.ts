import {Injectable} from 'angular2/core';

const couponAmount = 5000;
const couponCodes = [
    ['34C4LS', 'SUBST_C', 500],
    ['484R6L', 'SUBST_C', 1000],
    ['69ZFMH', 'SUBST_C', 1500],
    ['6EMAXV', 'PERC_C', 50],
    ['7M4PQY', 'ZERO_C', 0],

    //new coupons added 11/252016
    ['Frankly2016', 'ART_2016', 25],
    ['Freeblue212', 'BLUE212', 25],
    ['FreeFrankly2017', 'PER_25', 25],
    ['OffArtFrankly', 'PER_50', 50],
    ['FranklyArt', 'PER_75', 75],
    ['FranklyFree', 'PER_0', 0]
];

@Injectable()
export class CouponService {
  isValidCouponCode(couponCode: string) {
      return couponCodes.map( function (element) { return element[0]; } ).indexOf(couponCode) > -1;
  }

  getAmount(amount: number, couponCode: string) {
      let index = couponCodes.map( function (element) { return element[0]; } ).indexOf(couponCode);
      let cValue: number = Number(couponCodes[index][2]);

      console.log(index, cValue);

      if (couponCodes[index][1] === 'SUBST_C') {
          console.log(amount - cValue);

          return amount - cValue;
      }

      if (couponCodes[index][1] === 'PERC_C') {
          console.log(amount * cValue / 100);

          return amount * cValue / 100;
      }

      if (couponCodes[index][1] === 'ZERO_C') {
          console.log('Zero');

          return 0;
      }

      switch (couponCodes[index][1]) {
        case 'ART_2016':
          //console.log('Zero');
          amount = amount * cValue / 100;
          break;
        case 'BLUE212':
          //console.log('Zero');
          amount = amount * cValue / 100;
          break;
        case 'PER_25':
          console.log(amount * cValue / 100);
          amount = amount * cValue / 100;
          break;
        case 'PER_50':
          console.log(amount * cValue / 100);
          amount = amount * cValue / 100;
          break;
        case 'PER_75':
          console.log(amount * cValue / 100);
          amount = amount * cValue / 100;
          break;
        case 'PER_0':
          console.log('Zero');
          amount = 0;
          break;
      }

      return amount;
  }
}
