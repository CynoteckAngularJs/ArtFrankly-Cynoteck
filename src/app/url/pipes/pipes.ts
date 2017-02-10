import {PipeTransform, Pipe} from 'angular2/core';
import {Utils} from '../utils/index';

declare var moment: any;

@Pipe({ name: 'values',  pure: false })
export class ValuesPipe implements PipeTransform {
  transform(value: any, args: any[] = null): any {
    return Object.keys(value).map(key => {
      return {
        key: key,
        value: value[key]
      };
    });
  }
}

@Pipe({ name: 'formatdate',  pure: false })
export class FormatDatePipe implements PipeTransform {
  transform(value: Date, args: any[] = null): any {
    let format = args[0];
    return Utils.format(moment(value), format);
  }
}

@Pipe({ name: 'formataddress',  pure: false })
export class FormatAddressPipe implements PipeTransform {
  transform(value: any, args: any[] = null): any {
    return Utils.getAddressString(value);
  }
}

@Pipe({ name: 'filesize',  pure: false })
export class FileSizePipe implements PipeTransform {
  transform(size: number, args: any[] = null): any {
    if (isNaN(size)) {
      size = 0;
    }
    if (size < 1024) {
      return size + ' B';
    }
    size /= 1024;
    if (size < 1024) {
      return size.toFixed(1) + ' KB';
    }
    size /= 1024;
    if (size < 1024) {
      return size.toFixed(1) + ' MB';
    }
    size /= 1024;
    if (size < 1024) {
      return size.toFixed(1) + ' GB';
    }
    size /= 1024;
    return size.toFixed(1) + ' TB';
  }
}

@Pipe({ name: 'sortByDate' })
export class SortByDatePipe {
  transform(array: string[], args: string): string[] {
    if (typeof args[0] === undefined) {
      return array;
    }
    let direction   = args[0][0];
    let column      = args[0].slice(1);
    if (array) {
      array.sort((a: any, b: any) => {
        let left    = Number(new Date(a[column]));
        let right   = Number(new Date(b[column]));
        return (direction === '-') ? right - left : left - right;
      });
    }
    return array;
  }
}

@Pipe({ name: 'commatospacecomma',  pure: false })
export class CommaPipe implements PipeTransform {
  transform(value: string, args: any[] = null): any {
    // return value.replace(/\,/g, ', ');
    let tokens = (value || '').split(',');
    tokens = tokens.map((token) => ['<span class="token">', token, '</span>'].join(''));
    return tokens.join(' ');
  }
}

@Pipe({ name: 'commatospacecommalimited',  pure: false })
export class CommaLimitedPipe implements PipeTransform {
  transform(value: string, args: any[] = null): any {
    let DEFAULT_LIMIT = 3;
    let limit   = args && args.length ?
      parseInt(args[0][0], 10) || DEFAULT_LIMIT :
      DEFAULT_LIMIT;
    let tokens = (value || '').split(',');
    if (tokens.length > limit) {
      tokens = tokens.slice(0, limit);
      tokens.push('...');
    }
    tokens = tokens.map((token) => ['<span class="token">', token, '</span>'].join(''));
    return tokens.join(' ');
  }
}

@Pipe({ name: 'smarttext',  pure: false })
export class SmarTextPipe implements PipeTransform {
  transform(value: string, args: any[] = null): any {
    let str: string;
    if (value && value.trim().length) {
      str = value.replace(new RegExp('\r?\n', 'g'), '<br />');
    }
    return str;
  }
}

@Pipe({ name: 'reverse',  pure: false })
export class ReversePipe {
  transform(value: any[]) {
    return (value || []).slice().reverse();
  }
}

@Pipe({ name: 'urlcorrect',  pure: false })
export class UrlCorectPipe {
  transform(value: string) {
    value = value || '';
    let url = Utils.toURL(value.trim());
    return url;
  }
}
