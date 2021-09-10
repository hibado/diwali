import anime from 'animejs';

import { initStickyElement, getSupportedKeyword as getSupportedSticky } from '@zhinan-oppo/sticky';
import { addScrollListener } from '@zhinan-oppo/scroll-handle';
import { moveElementToLead, niceScrollTo, query, queryAll, scrollIntoView } from 'Common/dom';
import { isMobile, isPortrait } from '@/common/js/media';
import { round } from '@/common/js/math';

import { addTransitionEndListener } from '@/common/js/dom/event';
import windowSize from '@/common/js/media/window-size';
import { pushNavigation } from '@/common/js/gtm';
import { controlNavbarThemes } from '../navbar';

import './index.styl';

const ATTR_NAV = 'data-nav';

const portrait = isPortrait();
const stickySupported = getSupportedSticky();

function getNavbar() {
  return window.document.getElementById('navbar');
}

export function getNavHeight() {
  return portrait ? 50 : 60;
}

interface Anchor {
  li: HTMLLIElement;
  wrapper?: HTMLElement;
  anchor?: HTMLElement | null;
  name: string | null;
  a: HTMLSpanElement;
}

function createAnchors() {
  let anchors: Anchor[] = [];
  const wrappers = queryAll(document, `#main-wrapper [${ATTR_NAV}]`);
  anchors = queryAll('#navbar .links li').map((el) => {
    const anchorName = el.getAttribute('data-anchor');
    const anchorTarget = wrappers.find((i) => i.getAttribute(ATTR_NAV) === anchorName);
    return {
      li: el as HTMLLIElement,
      wrapper: anchorTarget,
      name: anchorName,
      a: query(el, 'a')!,
    };
  });
  return anchors;
}

function handleLinkEvents(container: HTMLElement, anchors: Anchor[]) {
  const indicator = query(container, '.indicator');

  const updateIndicator = ({ x, width }: { x: number; width: number }) => {
    anime.set(indicator, {
      translateX: round(x),
      scaleX: round(width / 100, 2),
    });
  };
  const moveIndicatorTo = (li: HTMLElement) => {
    if (!isPortrait()) {
      const { offsetLeft: x, offsetWidth: width } = li;
      window.requestAnimationFrame(() => {
        updateIndicator({ x, width });
      });
    } else {
      const { x, width } = li.getBoundingClientRect();
      const { scrollLeft } = container;
      window.requestAnimationFrame(() => {
        updateIndicator({ width, x: scrollLeft + x });
        const right = x + width;
        const shift = isMobile() ? 10 : 20;
        if (x < 10) {
          niceScrollTo(container, { dx: x - shift, y: 0 });
        } else if (right > windowSize.width) {
          niceScrollTo(
            container,
            { dx: right - windowSize.width + shift, y: 0 },
            { x: scrollLeft, y: 0 },
          );
        }
      });
    }
  };

  const active = anchors.map(() => false);
  const getActiveI = () => {
    return active.lastIndexOf(true);
  };
  let frameRequest: number | undefined;
  const setActive = (i: number, yes: boolean) => {
    if (active[i] !== yes) {
      active[i] = yes;
      if (frameRequest) {
        window.cancelAnimationFrame(frameRequest);
      }
      frameRequest = window.requestAnimationFrame(() => {
        frameRequest = undefined;
        const activeI = getActiveI();
        const anchor = anchors[activeI];
        if (anchor) {
          moveIndicatorTo(anchor.li);
        } else if (anchors[0]) {
          moveIndicatorTo(anchors[0].li);
        }
      });
    }
  };

  anchors.forEach(({ wrapper, a, name }, i) => {
    const activate = () => {
      if (name) {
        pushNavigation(name);
      }
      if (getActiveI() !== i && wrapper) {
        // 移动端导航栏有两行，向下偏移 50px
        scrollIntoView(wrapper, isPortrait() ? 49 : 0);
      }
    };
    a.addEventListener('click', activate);
    // a.addEventListener('touchend', activate);

    const placement = {
      percent: 'top' as const,
      distance: getNavHeight() * (isPortrait() ? 2 : 1),
    };
    if (wrapper) {
      addScrollListener(wrapper, {
        start: placement,
        end: placement,
        forceInViewBoundary: true,
        handlers: {
          onStateChange({ state }) {
            setActive(i, state !== 'before');
          },
        },
      });
    }
  });
}

export function init({
  outerNodeToInsertBefore = document.getElementById('main-wrapper'),
  autoPrepare = true,
  autoShow = true,
} = {}) {
  const root = getNavbar();
  if (!root) {
    return undefined;
  }
  const linkContainer = query(root, '.links')!;
  const prepare = () => {
    const anchors = createAnchors();
    handleLinkEvents(linkContainer, anchors);
    controlNavbarThemes();
  };
  const show = (isIndicatorHidden = true) => {
    root.classList.add('show');
    if (isIndicatorHidden) {
      addTransitionEndListener(
        root,
        () => {
          query(linkContainer, '.indicator')?.classList.add('show');
        },
        { timeout: 650 },
      );
    }
  };

  const showLinks = () => {
    linkContainer.classList.add('show');
  };
  const hideLinks = () => {
    linkContainer.classList.remove('show');
  };

  query(root, '.arrow')?.addEventListener('click', () => {
    linkContainer.classList.toggle('show');
  });

  let navbarMoved = false;
  window.requestAnimationFrame(() => {
    initStickyElement(root, {
      top: '-1px',
      scrollHandlers: {
        onStateChange({ state }) {
          if (state === 'inView') {
            root.classList.add('sticked');
          } else if (state === 'after' && stickySupported) {
            /**
             * 通过将 navbar 移动到 <footer> 同一层，避免划到 footer 时 navbar 被推走
             * FIXME: 不支持原生的 sticky 时暂时不好处理，先不管
             */
            if (!navbarMoved) {
              navbarMoved = true;
              if (outerNodeToInsertBefore) {
                moveElementToLead(root, outerNodeToInsertBefore);
              }
            }
          } else {
            root.classList.remove('sticked');
          }
        },
      },
    });
  });

  if (autoPrepare) {
    prepare();
  }
  if (autoShow) {
    show();
  }
  return {
    prepare: autoPrepare
      ? () => {
          // eslint-disable-next-line no-console
          console.info('Prepared already');
        }
      : prepare,
    show,
    showLinks,
    hideLinks,
  };
}
