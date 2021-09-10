import { addScrollListener } from '@zhinan-oppo/scroll-handle';
import { bodyFixed, queryAll } from './dom';

type Category = `${'Event' | 'Product'} Details`;

const conf = {
  category: __GTM_CATEGORY__,
  product: __GTM_PRODUCT__,
};

function hasEventPageMark() {
  return !!document.getElementById('event-mark-for-product');
}

function getPageCategory(): Category {
  return hasEventPageMark() ? 'Event Details' : conf.category;
}

export function configure(category: Category, product: string) {
  if (category) {
    conf.category = category;
  }
  if (product) {
    conf.product = product;
  }
}

function push({
  action,
  label,
  nonInteraction = false,
}: {
  action: string;
  label: string;
  nonInteraction?: boolean;
}) {
  if (typeof window.dataLayer?.push === 'function') {
    window.dataLayer.push({
      eventAction: action,
      eventLabel: label,
      nonInteraction,
      event: 'uaEvent',
      eventCategory: `${getPageCategory()} Page + ${conf.product}`,
    });
  }
}

export function pushNavigation(label: string) {
  push({
    label,
    action: `${getPageCategory()} Navigation`,
  });
}

export function pushCTAButton(label: string, name?: string | null) {
  push({
    label,
    action: name ? `CTA: ${name}` : 'CTA Button',
  });
}

export function pushStore(type: string, name: string) {
  push({
    label: `${type} + ${name}`,
    action: 'Where to buy',
  });
}

export function pushVideoStep(actionName: string, step: string) {
  push({
    label: step,
    action: `Video: ${actionName}`,
  });
}

export function pushLink(name: string, label: string) {
  push({
    label,
    action: `Click: ${name}`,
  });
}

export function pushMediaReview(name: string) {
  push({
    label: `Learn more + ${name}`,
    action: 'Media Review',
  });
}

export function pushImpression(label: string) {
  if (!bodyFixed()) {
    push({
      label,
      nonInteraction: true,
      action: `${getPageCategory()} Impression`,
    });
  }
  if (__DEV__ && bodyFixed()) {
    // eslint-disable-next-line no-console
    console.log(`禁用滚动（bodyFixed）时不触发 impression 事件: ${label}`);
  }
}

export function trackImpressionsByAttr(attr = 'data-gtm-view') {
  const elements = queryAll(document, `[${attr}]`);

  const observer =
    window.IntersectionObserver &&
    new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio > 0) {
            const label = entry.target.getAttribute(attr)!;
            pushImpression(label);
          }
        });
      },
      {
        rootMargin: '-25% 0px -50% 0px',
      },
    );
  if (observer) {
    elements.forEach((element) => observer.observe(element));
  } else {
    elements.forEach((element) => {
      const label = element.getAttribute(attr)!;
      addScrollListener(element, {
        start: { percent: 0.5 },
        end: { percent: 0.25 },
        handlers: {
          onStateChange({ state }) {
            if (state === 'inView') {
              pushImpression(label);
            }
          },
        },
      });
    });
  }

  return elements;
}

function addClickListener(
  element: Element,
  callback: (label: string) => void,
  attrLabel = 'data-gtm-label',
) {
  const label = element.getAttribute(attrLabel) || element.textContent;
  element.addEventListener(
    'click',
    () => {
      callback((label && label.replace(/(^\s+|\s+$)/g, '').replace(/(\s+)/, ' ')) || '');
    },
    { passive: true },
  );
}

export function trackClicksByAttr(
  attr = 'data-gtm-click',
  attrLabel = 'data-gtm-label',
  { root = document } = {},
) {
  queryAll(root, `[${attr}]`).forEach((element) => {
    const scope = element.getAttribute(attr);
    addClickListener(element, (label) => pushLink(scope || label, label), attrLabel);
  });
}

export function trackCTAByAttr(
  attr = 'data-gtm-cta',
  attrLabel = 'data-gtm-label',
  { root = document } = {},
) {
  queryAll(root, `[${attr}]`).forEach((element) => {
    const scope = element.getAttribute(attr);
    addClickListener(element, (label) => pushCTAButton(label, scope), attrLabel);
  });
}

export function trackEventsDefault({
  attrView = 'data-gtm-view',
  attrClick = 'data-gtm-click',
  attrLabel = 'data-gtm-label',
  attrCTA = 'data-gtm-cta',
} = {}) {
  const impressionElements = trackImpressionsByAttr(attrView);

  // 给模块中的 click 元素添加默认的 scope
  impressionElements.forEach((element) => {
    const viewLabel = element.getAttribute(attrView);
    const scope = viewLabel && viewLabel.replace(/^[^:]*:\s*/, '');
    if (scope) {
      queryAll(element, `[${attrClick}]`).forEach((el) => {
        if (!el.getAttribute(attrClick)) {
          el.setAttribute(attrClick, scope);
        }
      });
      queryAll(element, `[${attrCTA}]`).forEach((el) => {
        if (!el.getAttribute(attrCTA)) {
          el.setAttribute(attrCTA, scope);
        }
      });
    }
  });

  trackClicksByAttr(attrClick, attrLabel);
  trackCTAByAttr(attrCTA);
}
