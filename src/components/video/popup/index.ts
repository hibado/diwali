import { query, queryAll } from '@/common/js/dom';
import { Modal } from '@/components/modal';

import { createPopupPlayer } from '../video-util';

import './index.styl';

/**
 * #### initPopupPlayer
 * - 通过加上```.g--popup-user```类来激活弹窗 emmmmmm
 * - .g--popup-user 属性说明
 *    - 视频的路径(```data-src```) **必填**
 *    - 视频封面(```data-poster```)
 *    - 触发弹窗元素的类名 (```data-trigger```) 尽可能详细，避免重复 **必填**
 *    - 弹窗的类名(```data-class```) 以便于控制弹窗内视频的宽高
 *    - 弹窗的主题(```data-theme```) black（黑底白叉 默认） / white（白底黑叉） ```data-popup-class```加了后也可以自定义
 *    - 需要删除的navbar(```data-navbar```) 默认 .oc-header
 *    - 埋点相关标签(```data-label```)
 */
export const init = () => {
  const videoContainer = document.getElementById('zn--video-modal')!;
  const modal = new Modal(videoContainer, { selfContained: true, selfContainedClass: 'g--popup' });
  const closeBtn = query(videoContainer, '.g--popup-close')!;

  const popupUsers = queryAll('.g--popup-user');
  popupUsers.forEach((element) => {
    const {
      src: videoSrc,
      class: popupClass,
      trigger: triggerClass,
      theme = 'black',
      navbar: navBarClassName,
      label: videoLabel,
      poster,
      portrait,
    } = element.dataset;
    if (__DEV__) {
      if (!videoSrc || !triggerClass) {
        throw new Error(
          `data-src 和 data-trigger 属性是必须的：${JSON.stringify({ videoSrc, triggerClass })}`,
        );
      }
    }
    if (!videoSrc) return;

    const triggers = triggerClass ? queryAll(triggerClass) : [];
    const popupClasses = typeof popupClass === 'string' ? popupClass.split(' ') : [];
    if (portrait && portrait !== 'false') {
      popupClasses.push('video-portrait');
    }
    const { open, close } = createPopupPlayer(videoSrc!, {
      poster,
      popupClass: popupClasses,
      label: videoLabel,
      theme,
      navBarClass: navBarClassName || '.oc-header',
    });

    const handleCloseBtnClicked = () => {
      closeBtn.removeEventListener('click', handleCloseBtnClicked);
      modal.close();
      close();
    };
    triggers.forEach((el) => {
      // 相同类名触发器， 同一个类名触发器有多个，事件只添加一次，第一次进来的时候就全部加上了，后面无需加监听事件
      if (el.getAttribute('data-event') !== 'click') {
        el.setAttribute('data-event', 'click');
        el.addEventListener('click', () => {
          open();
          modal.open({ bgColor: theme === 'black' ? 'var(--bg-dark)' : 'var(--bg-light)' });
          closeBtn.addEventListener('click', handleCloseBtnClicked);
        });
      }
    });
  });
};
