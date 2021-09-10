import { medias } from 'Conf/medias';
import ResizeObserver from 'resize-observer-polyfill';

import { matchMedia, Media, Size, WindowSize } from '@zhinan-oppo/shared';

import { round } from '../math';
import { CounterSwitch } from '../utils/counter-switch';

const windowSize = WindowSize.singleton;

export function getWindowWidth() {
  return windowSize.width;
}

export function getMedia({ width, height }: Size = windowSize): Media & { ratio: number } {
  const media = matchMedia(medias, { width, height });
  if (!media) {
    if (__DEV__) {
      throw new Error(`未匹配到 media: ${{ width, height }}`);
    } else {
      return medias[0];
    }
  }
  return media as typeof medias[number];
}

export function getWindowHeight() {
  return windowSize.height;
}

let lastMedia = getMedia();
const mediaListeners: Array<(media: Media, old: Media) => void> = [];
windowSize.addSizeListener((size) => {
  const media = getMedia(size as Size);
  if (!media) {
    throw new Error(`No media configuration matched: [${size.width}, ${size.height}]`);
  }

  if (lastMedia && media !== lastMedia) {
    const old = lastMedia;
    mediaListeners.forEach((callback) => callback(media, old));
    lastMedia = media;
  }
});

export function addMediaListener(callback: typeof mediaListeners[number]) {
  mediaListeners.push(callback);
}

export function setPropertyVH(height: number, element = document.documentElement) {
  element.style.setProperty('--vh', `${round(height / 100, 2)}px`);
}

export function setPropertyVW(width: number, element = document.documentElement) {
  element.style.setProperty('--vw', `${round(width / 100, 2)}px`);
}

let maxHeight: number | undefined;
export function bindVH() {
  windowSize.addHeightListener((height) => {
    /**
     * 移动端 vh 只变大不变小，防止由于滚动时顶部变窄导致的内容抖动问题
     */
    if (
      maxHeight === undefined ||
      height! > maxHeight ||
      windowSize.width > 1024 // NOT mobile
    ) {
      setPropertyVH(height!);
      maxHeight = height;
    }
  });
  // 因为 resize 的事件会有延迟，初始时使用默认的 vh，否则 vh 会有突变
  // maxHeight = windowSize.height;
  // setPropertyVH(windowSize.height);
}

/**
 * 与 CSS 保持一致的 vh
 * @param {number} n
 * @returns {number}
 */
export function vh(n: number) {
  return ((maxHeight || windowSize.height) * n) / 100;
}

let resizeListener: boolean | ResizeObserver | undefined;
const resizeHandlers: Array<(...args: any[]) => void> = [];
let bodyWidth = document.body.clientWidth;
let bodyHeight = document.body.clientHeight;

export const noResizeEventSwitch = CounterSwitch.create();

/**
 * 监听页面尺寸变化
 * @param {() => void} callback
 */
export function addResizeListener(callback: typeof resizeHandlers[number]) {
  if (resizeHandlers.includes(callback)) {
    return;
  }

  resizeHandlers.push(callback);
  if (!resizeListener) {
    const resizeHandle = () => {
      if (__DEV__) {
        // 便于查看 resize 触发的影响
        // eslint-disable-next-line no-console
        console.log({
          noResizeEvent: noResizeEventSwitch.isOn,
          bodyWith: document.body.clientWidth,
          bodyHeight: document.body.clientHeight,
          callbacks: resizeHandlers.length,
        });
      }

      // 禁用时不触发
      if (noResizeEventSwitch.isOn) return;

      if (document.body.clientWidth !== bodyWidth || document.body.clientHeight !== bodyHeight) {
        resizeHandlers.forEach((callback) => {
          try {
            callback();
          } catch (e) {
            if (__DEV__) {
              throw e;
            } else {
              // eslint-disable-next-line no-console
              console.error(e);
            }
          }
        });

        bodyWidth = document.body.clientWidth;
        bodyHeight = document.body.clientHeight;
      }
    };

    if (ResizeObserver) {
      resizeListener = new ResizeObserver(resizeHandle);
      resizeListener.observe(document.body);
    } else {
      window.addEventListener('resize', resizeHandle);
      resizeListener = true;
    }
  }
}

let boundBodyWidth = bodyWidth;

function getClientWidth() {
  // eslint-disable-next-line no-return-assign
  return (boundBodyWidth = document.documentElement.clientWidth || document.body.clientWidth);
}

export function vw(n: number) {
  return ((boundBodyWidth || windowSize.width) * n) / 100;
}

export function bindVW() {
  addResizeListener(() => setPropertyVW(getClientWidth()));
  setPropertyVW(getClientWidth());
}

export default windowSize;
