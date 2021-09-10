import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import i18next from 'i18next';
import pug from 'pug';

export function classes(obj) {
  if (!obj) {
    return '';
  }

  if (typeof obj === 'string') {
    return obj;
  }

  const segments = Object.keys(obj)
    .map((key) => {
      if (obj[key]) {
        return key;
      }
      return false;
    })
    .filter(Boolean);
  return segments.join(' ');
}

export const parseClasses = classes;

function loadTranslations(dir, lng) {
  const translations = {};
  if (!fs.existsSync(dir)) {
    return translations;
  }
  fs.readdirSync(dir).forEach((nsOrLocale) => {
    const nested = path.resolve(dir, nsOrLocale);
    const stats = fs.statSync(nested);
    if (stats.isDirectory()) {
      // is namespace
      const ns = nsOrLocale;
      translations[ns] = loadTranslations(nested, lng);
    } else {
      // is locale
      const localeFilename = nsOrLocale;
      const matches = /(.*)\.yaml/.exec(localeFilename);
      if (!matches || matches[1] !== lng) return;

      const translation = YAML.parse(fs.readFileSync(nested, { encoding: 'utf-8' }));
      Object.assign(translations, translation);
    }
  });

  return translations;
}

export function prepareI18n(dir, lng, { t9nWrapper = false } = {}) {
  const translations = loadTranslations(dir, lng, []);

  i18next.init({
    lng,
    initImmediate: false,
    debug: false,
    resources: { [lng]: translations },
    returnObjects: true,
  });

  /**
   * 给文案包上 {{t9n:}} 标签
   *
   * 会对 array 和 object 进行递归处理
   */
  const transform = (translation) => {
    if (!translation) {
      return translation;
    }

    if (translation instanceof Array) {
      return translation.map((item) => transform(item));
    }

    if (typeof translation === 'object') {
      const data = {};
      Object.keys(translation).forEach((key) => {
        data[key] = transform(translation[key]);
      });
      return data;
    }

    return `{{t9n:${translation}}}`;
  };

  const translate = (...args) => {
    const translation = i18next.t(...args);
    if (!t9nWrapper) {
      return translation;
    }
    return transform(translation);
  };
  return {
    i18next,
    i18n: i18next,
    t: translate,
  };
}

export function pugInclude(absPath, options = {}) {
  return pug.renderFile(absPath, options);
}

export function prepareHelpers({ localeDir, lng, t9nWrapper = false, ROOT_PATH }) {
  const helpers = {
    classes,
    parseClasses,
    ...prepareI18n(localeDir, lng, { t9nWrapper }),
  };

  helpers.PUG_INCLUDE = (pathToPug, options = {}) =>
    pugInclude(path.resolve(ROOT_PATH, pathToPug), {
      ...options,
      ...helpers,
    });
  helpers.pugInclude = helpers.PUG_INCLUDE;
  return helpers;
}
