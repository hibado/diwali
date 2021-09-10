import './index.styl';

import {
  classAdd,
  classRemove,
  disableScroll,
  DisableScrollOptions,
  enableScroll,
  moveElement,
  moveElementToLead,
  query,
  removeElement,
} from '@/common/js/dom';
import { waitTransitionEnd } from '@/common/js/dom/event';
import windowSize from '@/common/js/media/window-size';
import { isIOS } from '@/common/js/ua-query';
import { nextFrame } from '@/common/js/utils/raf';
import { round } from '@/common/js/math';

export interface ModalOptions {
  /**
   * CSS color 字符串，预定义了 var(--bg-dark) 和 var(--bg-light)
   * @default 'var(--bg-dark)'
   */
  bgColor: string;
  classShow?: string;
  classHide?: string;

  /**
   * .bg 的 backdrop-filter 值
   * @example `true`: { backdrop-filter: blur(4px); }
   * @example `false`: { backdrop-filter: none; }
   * @example `5`: { backdrop-filter: blur(5px); }
   * @default false
   */
  blur?: boolean | number;

  /**
   * 点击 content 外区域（即背景）时，是否关闭 modal；
   * 此处触发的关闭操作直接调用 modal.close() ——使用了默认参数
   */
  closeWhenOutsideClicked: boolean;

  /**
   * 是否创建独立的 '.zn--modal' 容器
   * @default false 共用一个公用的'.zn--modal'容器，共用容器的 modal 同时只能保持一个打开
   */
  selfContained?: boolean;

  /**
   * 给 '.zn--modal' 容器加类，仅当 selfContained 为 true 时生效
   */
  selfContainedClass?: string;

  /**
   * 关闭时移除 content 元素，一般在 content 留在 DOM 树种会有影响时使用，例如 iframe 中的视频播放
   */
  removeContentOnClose?: boolean;

  /**
   * 传入 disableScroll() 的参数，默认为空，即使用 disableScroll() 的默认参数；
   * 特殊情况如背景半透明时，iOS 中使用默认参数会看到弹窗遮盖的内容发生变化，
   * 故需视情况选用合适的参数，例如使用 { disableEvents: true } ——尽管该参数有其他限制。
   * 默认参数说明见 DisableScrollOptions。
   */
  disableScrollOptions?: DisableScrollOptions;
}

let minViewportHeight = NaN;

const ROOT_CLASS = 'zn--modal';
const MODAL_CONTAINER_CLASSES = [ROOT_CLASS, 'zn--wrapper'];

function getClass(token: string, withDot = false) {
  return `${withDot ? '.' : ''}${ROOT_CLASS}-${token}`;
}

export class Modal {
  static containers: HTMLDivElement[] = [];

  static containerShared: HTMLDivElement | undefined;

  static updateModalMinViewportHeight(modal: HTMLDivElement) {
    if (!Number.isNaN(minViewportHeight)) {
      modal.style.height = `${minViewportHeight}px`;

      const content = query(modal, getClass('content', true));
      if (content) {
        content.style.setProperty('--vh', `${round(minViewportHeight / 100, 2)}px`);
      }
    }
  }

  private readonly root: HTMLDivElement;

  private readonly bg: HTMLElement;

  private readonly content?: Element;

  private readonly options: ModalOptions;

  private readonly _close = () => this.close();

  /**
   * 由于 iOS 上页面禁用滚动需要将 body 设置为 position:fixed，导致 modal 打开时页面回到顶部，
   * 最好**不要**将背景颜色设置为半透明的——当背景颜色是半透明时 disableScrollOptions 最好加上
   * { disableEvents: true }——但此时又会导致 modal 中的内容无法滚动。
   */
  constructor(
    content: Element | string,
    {
      bgColor = 'var(--bg-dark)',
      closeWhenOutsideClicked = true,
      ...options
    }: Partial<ModalOptions> = {},
  ) {
    let container = Modal.containerShared;
    if (options.selfContained || !container) {
      container = document.createElement('div');
      Modal.containers.push(container);

      classAdd(container, ...MODAL_CONTAINER_CLASSES);

      const bg = document.createElement('div');
      classAdd(bg, getClass('bg'));
      container.appendChild(bg);

      if (options.selfContained && options.selfContainedClass) {
        classAdd(container, options.selfContainedClass);
      }

      if (!options.selfContained && !Modal.containerShared) {
        Modal.containerShared = container;
      }

      // 将 container 挂到 body 末尾
      moveElement(container, document.body);
    }
    this.options = { ...options, closeWhenOutsideClicked, bgColor };
    this.root = container;
    this.bg = query(this.root, getClass('bg', true))!;
    this.content = typeof content === 'string' ? query(content)! : content;
    classAdd(this.content, getClass('content'));
  }

  get status(): 'open' | 'closed' | 'changing' {
    return (this.root.getAttribute('data-status') as any) || 'closed';
  }

  set status(status: 'open' | 'closed' | 'changing') {
    this.root.setAttribute('data-status', status);
  }

  open({
    bgColor = this.options.bgColor,
    blur = this.options.blur,
    disableScrollOptions = this.options.disableScrollOptions,
  }: Pick<Partial<ModalOptions>, 'bgColor' | 'blur' | 'disableScrollOptions'> = {}) {
    if (this.status !== 'closed') {
      return Promise.resolve();
    }

    const content = this.content;
    if (!content) {
      if (__DEV__) {
        throw new Error(`Content should be a HTMLElement, but got: ${content}`);
      }
      return Promise.resolve();
    }

    this.status = 'changing';
    const existingContent = query(this.root, getClass('content', true));
    if (existingContent !== content) {
      if (existingContent) {
        removeElement(existingContent);
      }
      moveElementToLead(content, this.bg, this.root);
    }
    // 在 content 加上之后
    Modal.updateModalMinViewportHeight(this.root);

    const { classShow, closeWhenOutsideClicked } = this.options;

    this.bg.style.backgroundColor = bgColor;
    this.root.style.setProperty(
      '--bg-blur',
      !blur ? '' : `blur(${typeof blur === 'number' ? blur : 4}px)`,
    );

    if (classShow) {
      classAdd(content, classShow);
    }

    if (closeWhenOutsideClicked) {
      this.bg.addEventListener('click', this._close);
    }

    return new Promise((resolve: (value: void) => void) => {
      nextFrame(() => {
        classAdd(this.root, getClass('show'));
        waitTransitionEnd(this.root, { timeout: 1000, bubble: false }).then(() => {
          this.status = 'open';
          disableScroll(disableScrollOptions);
          resolve();
        });
      });
    });
  }

  close({ removeContent = !!this.options.removeContentOnClose } = {}) {
    if (this.status !== 'open') {
      return Promise.resolve();
    }
    const content = this.content;
    if (!content) {
      return Promise.resolve();
    }

    this.status = 'changing';
    this.bg.removeEventListener('click', this._close);

    const hide = () => {
      classRemove(this.root, getClass('show'));
    };
    hide();
    enableScroll();
    return waitTransitionEnd(this.root, { timeout: 1000, bubble: false }).then(() => {
      this.status = 'closed';
      const content = query(this.root, getClass('content', true))!;
      if (content && removeContent) {
        removeElement(content);
      }
    });
  }
}

if (isIOS) {
  minViewportHeight = windowSize.height;
  windowSize.addHeightListener((height) => {
    if (height! < minViewportHeight) {
      minViewportHeight = height!;
      Modal.containers
        .filter((container) => container.getAttribute('data-status') === 'open')
        .forEach(Modal.updateModalMinViewportHeight);
    }
  });
}
