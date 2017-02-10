import {Injector} from 'angular2/core';
let appInjectorRef;

export function appInjector (injector?: Injector): Injector {
    if (!injector) {
        return appInjectorRef;
    }
    appInjectorRef = injector;
    return appInjectorRef;
};
