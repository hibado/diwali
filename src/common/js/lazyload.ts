import lazyLoadOptions from 'Conf/lazyload';
import { canIUseWebP } from '@/common/js/can-i-use';
import type { Options as LazyloadOptions } from '@zhinan-oppo/lazyload';
import type { ILazyLoadOptions } from 'vanilla-lazyload';

import { medias } from 'Conf';
import { queryAll } from './dom';

type UnwrapPromise<T extends Promise<any>> = T extends Promise<infer R> ? R : never;

/**
 * @typedef {import('@zhinan-oppo/lazyload').Exception} Exception
 */

export const options = {
  ...lazyLoadOptions,
  thresholds: '0px 200% 200% 200%',
};

const defaultSourceNames = {
  data_src: 'data-src',
  data_srcset: 'data-srcset',
  data_poster: 'data-poster',
  data_bg: 'data-bg',
};

function getValueWithNoWebpSupport(value: string) {
  if (/^data:/i.test(value)) {
    return value;
  }
  return value.replace(/\.webp/i, '');
}

const bgAttributes = ['data-bg', ...medias.map(({ alias }) => `data-bg-${alias}`)];
const loadableSelector = ['img', 'video', ...bgAttributes.map((attr) => `[${attr}]`)]
  .map((selector) => `.zn--wrapper ${selector}`)
  .join(',');
async function createLazyLoader(moreOptions: Partial<LazyloadOptions & ILazyLoadOptions> = {}) {
  const webpSupported = await canIUseWebP();

  if (!window.IntersectionObserver || !window.IntersectionObserverEntry) {
    await import(
      /* webpackChunkName: "intersection-observer" */
      /* webpackMode: "eager" */
      'intersection-observer'
    );
  }

  const { LazyLoad } = await import(
    /* webpackChunkName: "lazyload" */
    /* webpackMode: "eager" */
    '@zhinan-oppo/lazyload'
  );
  const instance = new LazyLoad({
    elements: loadableSelector, // NOTE: 需要能被 moreOptions 覆盖，createManualLoader 用到了
    ...options,
    ...moreOptions,

    // FIXME: 正确处理 srcset 格式
    srcPreprocessor: (value, { name, type, element }) => {
      // data-src-xxx 不存在时尝试使用 data-src
      if (!value && (type !== 'data_poster' || element instanceof HTMLVideoElement)) {
        const defaultName = defaultSourceNames[type];
        if (name !== defaultName) {
          const defaultValue = element.getAttribute(defaultName);
          if (defaultValue) {
            value = defaultValue;
          }
        }
      }

      if (value && !webpSupported) {
        return getValueWithNoWebpSupport(value);
      }
      return value;
    },
  });

  return {
    load(elements: { forEach: NodeListOf<HTMLElement>['forEach'] } | HTMLElement[]) {
      return instance.load(elements as unknown as { forEach: NodeListOf<HTMLElement>['forEach'] });
    },
    destroy() {
      instance.destroy();
    },
  };
}

const ATTR_LL_STATUS = 'data-ll-status';

export async function createManualLoader() {
  const loader = await createLazyLoader({
    elements: [],
  });
  return {
    load:
      /**
       * @param {HTMLImageElement|HTMLImageElement[]} elements
       * @param {object} options
       * @param {} options.onLoaded
       * @param {(element: HTMLImageElement, i: number) => void} options.onError
       */
      (
        elements: HTMLImageElement[],
        {
          onLoaded,
          onError,
        }: {
          onLoaded?: (element: HTMLImageElement, i: number) => void;
          onError?: (element: HTMLImageElement, i: number) => void;
        } = {},
      ) => {
        if (!(elements instanceof Array)) {
          elements = [elements];
        }
        const results: Array<boolean | undefined> = elements.map(() => undefined);
        const setResult = (i: number, loaded?: boolean) => {
          if (results[i] === undefined) {
            results[i] = loaded;
            if (loaded && onLoaded) {
              onLoaded(elements[i], i);
            }
            if (!loaded && onError) {
              onError(elements[i], i);
            }
          }
        };

        const elementsToLoad: HTMLElement[] = [];
        elements.forEach((element, i) => {
          const status = element.getAttribute(ATTR_LL_STATUS);

          if (status === 'loaded') {
            if (onLoaded) {
              setResult(i, true);
            }
          } else if (status === 'error') {
            setResult(i, false);
          } else {
            if (onLoaded) {
              const loadedListener = () => {
                element.removeEventListener('load', loadedListener);
                setResult(i, true);
              };
              element.addEventListener('load', loadedListener);
            }
            if (onError) {
              const errorListener = () => {
                element.removeEventListener('error', errorListener);
                setResult(i, false);
              };
              element.addEventListener('error', errorListener);
            }

            // 已经处于 loading 状态的不需要执行 load 操作
            if (status !== 'loading') {
              elementsToLoad.push(element);
            }
          }
        });

        loader.load(elementsToLoad).forEach((promise, i) => {
          promise
            .then(() => {
              setResult(i, true);
            })
            .catch(
              /** @param {Exception} exception */
              (exception) => {
                // eslint-disable-next-line no-console
                console.error(exception, exception.element);
                setResult(i, false);
              },
            );
        });
      },
  };
}

export function waitImageLoaded(image: HTMLImageElement) {
  const status = image.getAttribute('data-ll-status');
  if (status === 'loaded') {
    return Promise.resolve(image);
  }
  if (status === 'error') {
    return Promise.reject(new Error(`unknown error`));
  }

  return new Promise((resolve, reject) => {
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
  });
}

/**
 * @param {HTMLElement[]|string} elements
 * @param {object} options
 * @param {(v: { cnt: number; total: number}) => void} options.onFinished 结束回调
 * @param {(v: { cnt: number; total: number}) => void} options.onProgress 进度回调
 * @param {number} options.timeout 超时时间，单位 ms
 * @param {number} options.limit 限制一次发出的请求数
 */
export async function loadElements(
  elementOrContainer: HTMLElement[] | string,
  {
    onProgress,
    onFinished,
    timeout = 0,
    limit = 10,
  }: {
    onProgress?: (v: { cnt: number; total: number }) => void;
    onFinished?: (v: { cnt: number; total: number }) => void;
    timeout?: number;
    limit?: number;
  } = {},
) {
  if (limit < 0) {
    limit = 0;
  }

  const elementsOrContainers =
    typeof elementOrContainer === 'string'
      ? queryAll(document, elementOrContainer)
      : elementOrContainer;

  const elements: HTMLElement[] = [];
  const push = (element: HTMLElement) => {
    const status = element.getAttribute('data-ll-status');
    if (status !== 'loaded' && status !== 'error') {
      elements.push(element);
    }
  };
  elementsOrContainers.forEach((element) => {
    if (
      element instanceof HTMLImageElement ||
      element instanceof HTMLVideoElement ||
      bgAttributes.some((attr) => element.hasAttribute(attr))
    ) {
      push(element);
    } else {
      queryAll(element, 'img,video').forEach((child) => push(child));
    }
  });

  const total = elements.length;
  let cnt = 0;
  if (cnt === total) {
    return Promise.resolve();
  }

  let resolve: (...args: any[]) => void;
  const p = new Promise((_resolve) => {
    resolve = _resolve;
  });

  const progress = (i: number) => {
    if (i > cnt) {
      cnt = i;
      if (onProgress) {
        onProgress({ cnt, total });
      }
      if (cnt === total) {
        if (onFinished) {
          onFinished({ cnt, total });
        }
        resolve({ cnt, total });
      }
    }
    return cnt;
  };

  let loadingAt = limit - 1;
  let timeoutHandle: number;

  const loadedFlags = elements.map(() => false);
  /**
   *
   * @param {HTMLImageElement|HTMLVideoElement} el
   * @param {ReturnType<typeof createLazyLoader>} loader
   */
  const onLoaded = (
    el: HTMLElement,
    loader: UnwrapPromise<ReturnType<typeof createLazyLoader>>,
  ) => {
    const i = elements.indexOf(el);
    if (i >= 0 && !loadedFlags[i]) {
      loadedFlags[i] = true;
      if (progress(loadedFlags.filter(Boolean).length) === total) {
        window.clearTimeout(timeoutHandle);
        loader.destroy();
      } else if (loadingAt + 1 < elements.length) {
        loadingAt += 1;
        loader.load([elements[loadingAt]]);
      }
    }
  };
  const loader = await createLazyLoader({
    elements: [],
    callback_loaded: (el) => {
      onLoaded(el, loader);
    },
  });

  if (timeout > 0) {
    window.setTimeout(() => {
      progress(total);

      // 超时了，发出后续所有请求
      loader.load(elements.filter((_, i) => i > loadingAt));
    }, timeout);
  }

  elements.forEach(
    /** @param {HTMLElement} element */
    (element) => {
      if (element instanceof HTMLVideoElement) {
        element.addEventListener('canplaythrough', () => onLoaded(element, loader));
      } else if (element instanceof HTMLImageElement) {
        element.addEventListener('load', () => {
          onLoaded(element, loader);
        });
      }
    },
  );

  // 带有 data-ll-status 则是处于 loading 状态，不用再调用 load
  loader
    .load(elements.filter((element, i) => !element.hasAttribute('data-ll-status') && i < limit))
    .forEach((promise) => {
      promise
        .then((ele) => onLoaded(ele as HTMLImageElement | HTMLVideoElement, loader))
        .catch(
          /** @param {Exception} e */
          (e) => {
            // eslint-disable-next-line no-console
            console.error(e, e.element);
            onLoaded(e.element, loader);
          },
        );
    });

  return p;
}

/**
 * 用于禁用 OPPO 一级导航栏依赖的懒加载，和 js 的位置相关，不一定起作用
 */
function disableLazySizes() {
  // oneplus 没有 lazySizes？
  if (__OPPO__) {
    window.lazySizesConfig = window.lazySizesConfig || {};
    window.lazySizesConfig.init = false;
  }
}

/**
 * 持续尝试执行 lazySizes.init() ——防止第一次执行时相关 js 未加载导致 lazySizes 不被初始化
 */
function enableLazySizes(cnt = 1) {
  // oneplus 没有 lazySizes？
  if (__OPPO__) {
    if (cnt <= 3000) {
      if (typeof window.lazySizes?.init === 'function') {
        window.lazySizes.init();
      } else {
        window.setTimeout(() => enableLazySizes(cnt + 1), 500);
      }
    }
  }
}

const waitingPromises: Array<{ [K in 'resolve' | 'reject']: (...args: any[]) => void }> = [];

let enabled = true;
/** @type {ReturnType<typeof useLazyload>} */
let initialized: ReturnType<typeof createLazyLoader>;

export function disableLazyload() {
  if (!initialized) {
    enabled = false;
    disableLazySizes();
  } else {
    // eslint-disable-next-line no-console
    console.warn('Cannot disable lazyload: already initialized');
  }
}

export function enableLazyload() {
  if (!initialized) {
    initialized = createLazyLoader();

    setTimeout(enableLazySizes);
  }
  enabled = true;

  while (waitingPromises.length > 0) {
    const p = waitingPromises.shift()!;
    p.resolve(initialized);
  }
}

/**
 * @typedef {import('@zhinan-oppo/lazyload').LazyLoad} LazyLoad
 * @returns {ReturnType<typeof createLazyLoader>}
 */
export function useLazyload() {
  if (!enabled) {
    return new Promise((resolve, reject) => {
      waitingPromises.push({ resolve, reject });
    });
  }
  if (!initialized) {
    initialized = createLazyLoader();
  }
  return Promise.resolve(initialized);
}
