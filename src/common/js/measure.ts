// 获取各种尺寸的库，对应元素都是到页面顶部的距离

import { medias } from 'Conf/medias';
import { round } from './math';
import { getMedia, vh, vw } from './media/window-size';

/**
 * 获取元素顶部到页面顶部的距离
 * @param {HTMLElement} element
 * @returns Number
 */
export function top(element: Element) {
  if (!element) return 0;
  return $(element).offset()?.top ?? 0;
}

/**
 * 获取元素的宽度
 * @param {HTMLElement} element
 * @returns Number
 */
export function width(element: HTMLElement) {
  return element.offsetWidth;
}

/**
 * 获取元素的高度
 * @param {HTMLElement} element
 * @returns Number
 */
export function height(element: HTMLElement) {
  return element.offsetHeight;
}

/**
 * 获取元素底部到页面顶部的距离
 * @param {HTMLElement} element
 * @returns Number
 */
export function bottom(element: HTMLElement) {
  return top(element) + height(element);
}

/**
 * 获取元素中部到页面顶部的距离
 * @param {HTMLElement} element
 * @returns Number
 */
export function center(element: HTMLElement) {
  return top(element) + height(element) / 2;
}

const rpxBaseMedia = medias.find(({ alias }) => alias === '1920')!;

/**
 * 获取 rpx 对应的 px
 * @param {number} number
 * @returns number
 */
export function rpx(number: number) {
  const media = getMedia();
  if (['360', '768'].includes(media.alias)) {
    return vw(round((100 / 360) * number, 3));
  }

  if (__OPPO__) {
    return (number * media.ratio) / rpxBaseMedia.ratio;
    // eslint-disable-next-line no-else-return
  } else {
    // if (__ONEPLUS__)
    return vw(round((100 / 1920) * number, 4));
  }
}

/**
 * 获取 mpx 对应的 px
 * @param {number} number
 * @returns number
 */
export const mpx = rpx;

export { vh, vw };
