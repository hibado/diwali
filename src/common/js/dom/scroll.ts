import anime from 'animejs';

import { noResizeEventSwitch } from '../media/window-size';
import { isIOS } from '../ua-query';
import { CounterSwitch } from '../utils/counter-switch';
import { nextFrame } from '../utils/raf';
import { classAdd, classRemove } from './attribute';

export function niceScrollTo(
  element: HTMLElement | Window,
  {
    x,
    y,
    dx = 0,
    dy = 0,
    duration = 400,
    easing = 'linear',
    ...rest
  }: {
    x?: number;
    y?: number;
    dx?: number;
    dy?: number;
    duration?: number;
    easing?: anime.EasingOptions;
  } & anime.AnimeAnimParams,
  from: { x?: number; y?: number } = {},
) {
  const pos = {
    x: from.x ?? (element instanceof Window ? window.scrollX : element.scrollLeft),
    y: from.y ?? (element instanceof Window ? window.scrollY : element.scrollTop),
  };
  anime({
    x: [pos.x, x ?? pos.x + dx],
    y: [pos.y, y ?? pos.y + dy],
    duration,
    easing,
    targets: pos,
    round: 1,
    ...rest,
    update(instance) {
      element.scrollTo(pos.x, pos.y);
      if (rest.update) {
        rest.update(instance);
      }
    },
  });
}

export function scrollIntoView(element: Element, offset = 0) {
  window.scrollTo(0, Math.ceil(window.pageYOffset + element.getBoundingClientRect().top - offset));
}

function prevent(evt: MouseEvent | TouchEvent) {
  if (evt.cancelable) {
    evt.preventDefault();
  }
}

const scrollState: {
  cntDisabled: number;
  eventsDisabled: boolean;
  bodyFixed: boolean;
  bodyFixedAnchor?: Element;
  bodyFixedAnchorOffset: number;
} = {
  cntDisabled: 0,
  eventsDisabled: false,
  bodyFixed: false,
  bodyFixedAnchor: undefined,
  bodyFixedAnchorOffset: 0,
};

function disableScrollEvents() {
  if (!scrollState.eventsDisabled) {
    scrollState.eventsDisabled = true;

    window.addEventListener('wheel', prevent, { passive: false });
    // window.addEventListener('touchstart', prevent, { passive: false });
    window.addEventListener('touchmove', prevent, { passive: false });
  }
}

function enableScrollEvents() {
  if (scrollState.eventsDisabled) {
    scrollState.eventsDisabled = false;

    window.removeEventListener('wheel', prevent);
    // window.removeEventListener('touchstart', prevent);
    window.removeEventListener('touchmove', prevent);
  }
}

export interface DisableScrollOptions {
  /**
   * ???????????? wheel ??? touchmove ??????
   * @default false
   */
  disableEvents?: boolean;

  /**
   * ????????? body ??????`position: fixed`?????? Safari ??????????????????????????????????????????????????????????????????????????????????????????????????????
   * @default isIOS
   */
  fixedBody?: boolean;

  /**
   * ????????? fixed
   * @default undefined
   */
  fixedAnchor?: Element;

  /**
   * ????????? body ?????? width???????????????????????????????????????
   * @default false
   */
  setBodyWidth?: boolean;
}

const noScrollSwitch = CounterSwitch.create(
  function toDisableScroll({
    disableEvents = false,
    fixedBody = disableEvents === true ? false : isIOS, // disableEvents ??? true ??????????????? fixedBody
    fixedAnchor,
    setBodyWidth = false,
  }: Partial<DisableScrollOptions> = {}) {
    if (disableEvents) {
      disableScrollEvents();
    }
    if (fixedBody && !scrollState.bodyFixed) {
      noResizeEventSwitch.on();

      scrollState.bodyFixed = true;
      scrollState.bodyFixedAnchor = fixedAnchor;
      scrollState.bodyFixedAnchorOffset = fixedAnchor
        ? fixedAnchor.getBoundingClientRect().top
        : window.pageYOffset;
      document.body.style.position = 'fixed'; // TODO: ????????????????????????body.zn--body-fixed ???????????????
      classAdd(document.body, 'zn--body-fixed');
    }
    if (setBodyWidth) {
      document.body.style.width = `${document.body.clientWidth}px`;
    }
    document.body.classList.add('no-scroll');
  },
  function toEnableScroll() {
    enableScrollEvents();

    document.body.classList.remove('no-scroll');
    document.body.style.width = '';

    if (scrollState.bodyFixed) {
      classRemove(document.body, 'zn--body-fixed');
      document.body.style.position = ''; // TODO: ????????????????????????body.zn--body-fixed ???????????????

      const { bodyFixedAnchor, bodyFixedAnchorOffset } = scrollState;
      if (bodyFixedAnchor) {
        scrollIntoView(bodyFixedAnchor, bodyFixedAnchorOffset);
      } else {
        window.scrollTo(0, bodyFixedAnchorOffset);
      }

      return nextFrame(nextFrame).then(() => {
        // 2??????
        scrollState.bodyFixed = false;
        scrollState.bodyFixedAnchor = undefined;
        noResizeEventSwitch.off();
      });
    }
    return Promise.resolve();
  },
);

export function bodyFixed() {
  return scrollState.bodyFixed;
}

export function canScroll() {
  return noScrollSwitch.isOff;
}

export function disableScroll(options: Partial<DisableScrollOptions> = {}) {
  noScrollSwitch.on(options);
}

export function enableScroll() {
  noScrollSwitch.off();
}
