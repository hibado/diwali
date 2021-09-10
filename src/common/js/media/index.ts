import type { Media } from '@zhinan-oppo/shared';

import { getMedia } from '@/common/js/media/window-size';

/**
 * 判断当前屏幕方向
 */
export function isPortrait(media: Media = getMedia()) {
  return ['360', '768'].includes(media.alias);
}

export const isNotPC = isPortrait;

/**
 * 判断当前是否为移动端尺寸
 */
export function isMobile(media: Media = getMedia()) {
  return media.alias === '360';
}
