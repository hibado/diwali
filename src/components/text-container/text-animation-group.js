import anime from 'animejs';
// import throttle from 'lodash/throttle';
import { addScrollListener } from '@zhinan-oppo/scroll-handle';
import { isPortrait } from '@/common/js/media';

// 分层出现的文字动画
const CLASS_GROUP = '.ta--group';
const CLASS_ITEM = '.ta--item';
const CLASS_ITEM_LS = '.ta--item-ls';
const CLASS_ITEM_PT = '.ta--item-pt';

// 一并出现的文字动画
const CLASS_GROUP_1 = '.ta--group-1';
const CLASS_ITEM_1 = '.ta--item-1';
const CLASS_ITEM_LS_1 = '.ta--item-ls-1';
const CLASS_ITEM_PT_1 = '.ta--item-pt-1';

// const ATTR_SEQ_FLAG = 'data-has-seq';
// const ATTR_SEQ = 'data-seq';
// const ATTR_SEQ_PT = 'data-seq-pt';
// const ATTR_SEQ_LS = 'data-seq-ls';

/**
 * @param {HTMLElement} container
 * @param {Array<{ element: HTMLElement; seq: number; }>} items
 */
export function handleTextAppearance(container, items) {
  const timelineInner = anime.timeline({ autoplay: false, easing: 'linear' }).add(
    {
      targets: items.map(({ element }) => element),
      translateY: (el, i) => {
        const { seq } = items[i];
        return [40 + seq * 50, 0];
      },
      duration: 1,
    },
    0,
  );
  const timelineOuter = anime.timeline({ autoplay: false, easing: 'linear' }).add(
    {
      targets: container,
      opacity: [0, 1],
      duration: 1,
    },
    0,
  );

  const seek = (p) => timelineInner.seek(p);
  // : throttle(
  //     (p) => {
  //       timelineInner.seek(p);
  //     },
  //     200,
  //     { leading: true, trailing: true },
  //   );
  const boundary = { percent: 0.9 };
  addScrollListener(container, {
    start: boundary,
    end: boundary,
    forceInViewBoundary: true,
    handlers: {
      inView({ distance, total }) {
        const p = distance / total;
        timelineOuter.seek(p);
        seek(p);
      },
    },
  });
}

export function initTextAnimationGroups() {
  const itemSelector = `${CLASS_ITEM},${isPortrait() ? CLASS_ITEM_PT : CLASS_ITEM_LS}`;
  document.querySelectorAll(CLASS_GROUP).forEach((group) => {
    const items = [];
    group.querySelectorAll(itemSelector).forEach(
      /** @param {HTMLElement} element */
      (element, i) => {
        items.push({
          element,
          seq: i,
        });
      },
    );
    handleTextAppearance(group, items);
  });
}

export function initTextAnimationGroups1() {
  const itemSelector = `${CLASS_ITEM_1},${isPortrait() ? CLASS_ITEM_PT_1 : CLASS_ITEM_LS_1}`;
  document.querySelectorAll(CLASS_GROUP_1).forEach((group) => {
    const items = [];
    group.querySelectorAll(itemSelector).forEach(
      /** @param {HTMLElement} element */
      (element, i) => {
        items.push({
          element,
          seq: 0,
        });
      },
    );
    handleTextAppearance(group, items);
  });
}
