import {
  getValue,
  HashMap,
  isDefined,
  isObject,
  isString,
  setValue,
  Translation,
  TranslocoConfig,
  translocoConfig,
  TranslocoFallbackStrategy,
  TranslocoInterceptor,
  TranslocoLoader,
  TranslocoMissingHandler,
  TranslocoService,
} from '@ngneat/transloco';
import * as fs from 'fs';
import * as path from 'path';
import { bindNodeCallback, Observable } from 'rxjs';
import { environment } from '../src/environments/environment';

// tslint:disable-next-line:no-console
const log = console.log;

class TranslocoLocalLoader implements TranslocoLoader {
  /**
   * Loads translation file, depending on given language code
   * @param lang Language code or file name
   */
  public getTranslation(lang: string): Observable<Translation> {
    const currDir = path.resolve(__dirname);

    const readFileAsObservable = bindNodeCallback(fs.readFile);
    // @ts-ignore
    const result = readFileAsObservable(
      `${currDir}/../src/assets/i18n/${lang}.json`
    );
    result.subscribe(
      (x) => log(x),
      (e) => log(e)
    );
    return result;
  }
}

class CustomHandler implements TranslocoMissingHandler {
  public handle(key: string, config: TranslocoConfig): string {
    return `key: ${key} is missing`;
  }
}

export class CustomInterceptor implements TranslocoInterceptor {
  public preSaveTranslation(
    translation: Translation,
    lang: string
  ): Translation {
    return translation;
  }

  public preSaveTranslationKey(
    key: string,
    value: string,
    lang: string
  ): string {
    return value;
  }
}

// tslint:disable-next-line:interface-name
export interface TranslocoTranspiler {
  // tslint:disable-next-line:no-any
  transpile(value: any, params: HashMap, translation: HashMap): any;
  onLangChanged?(lang: string): void;
}

export class CustomFallbackStrategy implements TranslocoFallbackStrategy {
  getNextLangs(failedLang: string): string[] {
    return ['de'];
  }
}

export class CustomTranspiler implements TranslocoTranspiler {
  protected interpolationMatcher: RegExp;

  constructor(userConfig?: TranslocoConfig) {
    const [start, end] =
      userConfig && userConfig.interpolation
        ? userConfig.interpolation
        : [1, 2];
    this.interpolationMatcher = new RegExp(`${start}(.*?)${end}`, 'g');
  }

  // tslint:disable-next-line:no-any
  public transpile(
    value: any,
    params: HashMap = {},
    translation: Translation
  ): any {
    if (isString(value)) {
      return value.replace(this.interpolationMatcher, (_, match) => {
        match = match.trim();
        if (isDefined(params[match])) {
          return params[match];
        }

        return isDefined(translation[match])
          ? this.transpile(translation[match], params, translation)
          : '';
      });
    } else if (params) {
      if (isObject(value)) {
        value = this.handleObject(value, params, translation);
      } else if (Array.isArray(value)) {
        value = this.handleArray(value, params, translation);
      }
    }

    return value;
  }

  // tslint:disable-next-line:typedef no-any
  protected handleObject(
    value: any,
    params: HashMap = {},
    translation: Translation
  ) {
    let result = value;

    Object.keys(params).forEach((p) => {
      // get the value of "b.c" inside "a" => "Hello {{ value }}"
      const v = getValue(result, p);
      // get the params of "b.c" => { value: "Transloco" }
      const getParams = getValue(params, p);

      // transpile the value => "Hello Transloco"
      const transpiled = this.transpile(v, getParams, translation);

      // set "b.c" to `transpiled`
      result = setValue(result, p, transpiled);
    });

    return result;
  }

  // tslint:disable-next-line:typedef
  protected handleArray(
    value: string[],
    params: HashMap = {},
    translation: Translation
  ) {
    return value.map((v) => this.transpile(v, params, translation));
  }
}

export function loadTranslocoService(): TranslocoService {
  const translocoConf = translocoConfig({
    availableLangs: ['de', 'en'],
    defaultLang: 'de',
    fallbackLang: ['de'],
    reRenderOnLangChange: true,
    prodMode: environment.production,
    flatten: {
      aot: environment.flattenTranslations,
    },
  });

  const translocoSvc = new TranslocoService(
    new TranslocoLocalLoader(),
    new CustomTranspiler(),
    new CustomHandler(),
    new CustomInterceptor(),
    translocoConf,
    new CustomFallbackStrategy()
  );
  const currDir = path.resolve(__dirname);
  const translation = fs.readFileSync(
    `${currDir}/../src/assets/i18n/${translocoSvc.getActiveLang()}.json`,
    'utf-8'
  );
  translocoSvc.setTranslation(
    JSON.parse(translation),
    translocoSvc.getActiveLang()
  );
  return translocoSvc;
}
