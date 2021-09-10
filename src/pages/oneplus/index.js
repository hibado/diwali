import { beforeReady, onReady } from '@/common/js/initialize';

import './index.styl';
import { enableLazyload } from '@/common/js/lazyload';
import { oneFinishLoading } from '@/common/js/utils/oneplus';

if (__DEV__) {
  // 为了在 pug 文件修改后自动刷新页面
  import(/* webpackChunkName: 'dev.pug' */ './index.pug');
}

beforeReady();

function handleReady() {
  onReady();

  // 通过该方法可以使现代浏览器在刷新页面时不自动 scroll
  if (window.history.scrollRestoration) {
    window.history.scrollRestoration = 'manual';
  }

  enableLazyload();
  oneFinishLoading();
}

if (__ONEPLUS__) {
  $(handleReady);
} else {
  handleReady();
}
