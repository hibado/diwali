interface EventOptions {
  timeout?: number;
  bubble?: boolean;
}

type Callback = (...args: any[]) => void;

/**
 * 监听到指定元素事件后执行回调函数
 * 只会执行一次
 *
 * @param {HTMLElement} element
 * @param {string} event
 * @param {() => void} callback
 *
 * @param {object} options
 * @param {number} options.timeout 超时时间后回调函数也会被调用
 * @param {boolean} options.bubble 是否响应子元素的事件
 */
export function addEventHandler(
  element: Element,
  event: string,
  callback: Callback,
  { timeout = 0, bubble = true }: EventOptions = {},
) {
  let timeoutHandle: number;
  const onEnd = (e: Event) => {
    // children 的 event 不处理
    if (!bubble && e.target !== element) {
      return;
    }

    element.removeEventListener(event, onEnd);
    callback();

    if (timeoutHandle) {
      window.clearTimeout(timeoutHandle);
    }
  };
  const onTimeout = () => {
    callback();
    element.removeEventListener(event, onEnd);
  };

  element.addEventListener(event, onEnd);
  if (timeout > 0) {
    timeoutHandle = window.setTimeout(onTimeout, timeout);
  }
}

/**
 * @param {HTMLElement} element
 * @param {string} event
 *
 * @param {object} options
 * @param {number} options.timeout 超时时间后回调函数也会被调用
 * @param {boolean} options.bubble 是否响应子元素的事件
 */
export function waitEvent(element: HTMLElement, event: string, options: EventOptions = {}) {
  return new Promise((resolve) => {
    addEventHandler(element, event, resolve, options);
  });
}

/**
 * 监听到指定元素 transitionend 事件后执行回调函数
 * 只会执行一次
 *
 * @param {HTMLElement} element
 * @param {() => void} callback
 *
 * @param {object} options
 * @param {number} options.timeout 超时时间后回调函数也会被调用
 * @param {boolean} options.bubble 是否响应子元素的 transitionend 事件
 */
export function addTransitionEndListener(
  element: Element,
  callback: Callback,
  options: { timeout?: number; bubble?: boolean },
) {
  return addEventHandler(element, 'transitionend', callback, options);
}

/**
 * 监听到指定元素 transitionend 事件
 * 返回 promise
 *
 * @param {HTMLElement} element
 *
 * @param {object} options
 * @param {number} options.timeout 超时时间后回调函数也会被调用
 * @param {boolean} options.bubble 是否响应子元素的 transitionend 事件
 * @param {boolean} options.rejectWhenCancel transitioncancel 事件是否 reject
 */
export function waitTransitionEnd(
  element: Element,
  {
    rejectWhenCancel,
    ...options
  }: { timeout?: number; bubble?: boolean; rejectWhenCancel?: boolean } = {},
) {
  return new Promise((resolve, reject) => {
    addTransitionEndListener(element, resolve, options);
    if (rejectWhenCancel) {
      addEventHandler(element, 'transitioncancel', reject, options);
    }
  });
}

/**
 * @see waitImageLoaded() in lazyload.js
 */
export function waitImageLoad(image: HTMLImageElement, { timeout = 0 }: EventOptions = {}) {
  return new Promise((resolve: (image: HTMLImageElement) => void, reject) => {
    if (timeout > 0) {
      window.setTimeout(() => reject(new Error('timeout')), timeout);
    }

    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('error')));
  });
}
