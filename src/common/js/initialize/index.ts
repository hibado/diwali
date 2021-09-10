// 需要时在 pages 里调用
// import { init as initVideoConverter } from 'Components/video/converter';
// import { controlNavbarThemes } from 'Components/navbar';

// 包含了影响 ScrollListener 的代码
import '../scroll-listener';

import { init as initPopupPlayer } from 'Components/video/popup';

import { resolveAttributes } from '@/common/js/initialize/attr-resolver';
import { isPortrait } from '@/common/js/media';
import { addMediaListener, bindVH, bindVW } from '@/common/js/media/window-size';
import { Media } from '@zhinan-oppo/shared';

import { disableScroll, enableScroll, removeElementAll, scrollIntoView } from '../dom';
import { trackEventsDefault } from '../gtm';
import { useLazyload } from '../lazyload';
import { nextFrame } from '../utils/raf';
import { initStickyElements } from './sticky';

export function beforeReady() {
  bindVH();
  if (!isPortrait()) {
    bindVW();
  }

  resolveAttributes([
    {}, // 默认的 data-url-val 和 data-url-attr，data-url-val 在 build 时会与 data-src 一样做处理
    {
      value: 'data-resp-val',
      attr: 'data-resp-attr',
    },
  ]);

  addMediaListener((media: Media, old: Media) => {
    if (isPortrait(media) !== isPortrait(old)) {
      window.location.reload();
    }
  });
}

/**
 * 通过 elementScrollTo 指定每次页面加载后需要滚动到的位置
 */
export function onReady({ elementScrollTo }: { elementScrollTo?: HTMLElement | null } = {}) {
  if (elementScrollTo) {
    // 禁用浏览器刷新恢复滚动位置的机制
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
    disableScroll({ disableEvents: true, fixedBody: false });
  }

  /* 在通常的使用场景下，加上 nextFrame 可以在各个模块的初始化后执行下列操作
   * 特别是 useLazyload() 如果提前调用，disableLazyload() 会失效 */
  nextFrame(() => {
    if (elementScrollTo) {
      enableScroll();
    }

    trackEventsDefault();
    useLazyload();

    // 需要时在 pages 里调用，尽量不要把非通用的功能放到 common 里
    // controlNavbarThemes();
    // initVideoConverter();
  });
}
