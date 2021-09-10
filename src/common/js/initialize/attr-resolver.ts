import { configureAndResolve } from '@zhinan-oppo/attr-resolver';
import { medias } from 'Conf/medias';
import conf from 'Conf/attr-resolver';
import { addMediaListener } from '../media/window-size';

function resolve({ value = conf.value, attr = conf.attr } = {}) {
  configureAndResolve({
    value,
    attr,
    medias,
  });
}

interface Options {
  attr?: string;
  value?: string;
}

export function resolveAttributes(options: Options | Options[]) {
  const onMediaChange = () => {
    (Array.isArray(options) ? options : [options]).forEach((options) => {
      resolve(options);
    });
  };
  addMediaListener(onMediaChange);
  onMediaChange();
}
