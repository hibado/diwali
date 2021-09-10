import { classToggle, removeElement } from '@/common/js/dom';

let pushVideoStep = () => undefined;

if (__OPPO__) {
  import(
    /* webpackChunkName: "gtm" */
    /* webpackMode: "eager" */
    '@/common/js/gtm'
  ).then((gtm) => {
    pushVideoStep = gtm.pushVideoStep;
  });
}

/**
 * 设置元素多个 attr
 * @param {HTMLElement} el
 * @param {object} attrs
 */
function setAttributes(el, attrs) {
  Object.keys(attrs).forEach((key) => {
    el.setAttribute(key, attrs[key]);
  });
}

/**
 * 获取元素 attr
 * @param {HTMLElement} el
 */
function getAttributes(el) {
  const { attributes } = el;
  const { length } = attributes;
  const attrs = Object.create(null);
  for (let i = 0; i < length; i += 1) attrs[attributes[i].name] = attributes[i].value;
  return attrs;
}

/**
 * 获取 video 元素
 * @param {String} src 视频路径
 * @param {String} poster 视频封面路径
 */
function getVideoElement(src, poster = '') {
  const videoElement = document.createElement('video');
  setAttributes(videoElement, {
    src,
    poster,
    preload: 'metadata',
    autoplay: 'autoplay',
    controls: 'controls',
    playsinline: 'playsinline',
    'webkit-playsinline': 'webkit-playsinline',
  });
  return videoElement;
}

/**
 * 视频埋点
 * @param {HTMLVideoElement} video
 * @param {String} label
 */
const setVideoGtm = (video, label) => {
  const step = 25;
  let progress = 0;
  video.ontimeupdate = () => {
    if (video.duration < 15) return;
    const p = (video.currentTime / video.duration) * 100;
    if (p >= progress + step) {
      progress += step;
      pushVideoStep(label, `${progress}%`);
    }
  };
  video.onplay = () => {
    pushVideoStep(label, 'play');
  };
  video.onpause = () => {
    pushVideoStep(label, 'pause');
  };
};

/**
 * 视频弹窗方法
 * 所有弹窗视频公用一个弹窗: 类名为#zn--video-modal的元素
 *  - 弹出的时候放入不同的video元素，关闭的时候移除video元素
 * @param {String} videoSrc 视频路径
 * @param {object|undefined} options
 * @param {String|undefined} options.label 埋点相关标签
 * @param {String|undefined} options.poster 视频封面路径
 * @param {String[]|string|undefined} options.popupClass 打开弹窗时上的类，关闭时移除
 * @param {String|undefined} options.theme 弹窗主题 black(黑底白×) || white(白底黑×)
 * @param {function|undefined} options.onOpen 打开弹窗的回调
 * @param {function|undefined} options.onClose 关闭弹窗的回调
 */
function createPopupPlayer(
  videoSrc,
  { label, poster, popupClass = [], theme = 'black', onOpen = () => {}, onClose = () => {} } = {},
) {
  if (!videoSrc) return { close: () => undefined, open: () => undefined };
  if (!Array.isArray(popupClass)) {
    popupClass = [popupClass];
  }
  const root = document.getElementById('zn--video-modal');
  const videoWrapper = root.querySelector('.g--video-wrapper');

  let video;

  const stateController = (state = 'expand') => {
    const toShow = state === 'expand';
    classToggle(root, {
      ...popupClass.reduce((obj, token) => {
        obj[token] = toShow;
        return obj;
      }, {}),
    });

    root.setAttribute('data-theme', `${toShow ? theme : ''}`);
  };

  const open = () => {
    // uc视频问题
    if (videoWrapper.children.length === 2) {
      videoWrapper.removeChild(videoWrapper.children[1]);
    }

    video = getVideoElement(videoSrc, poster);
    videoWrapper.appendChild(video);
    stateController('expand');
    setVideoGtm(video, label);

    if (video.paused) {
      const p = video.play();
      if (p && typeof p.catch === 'function') {
        // eslint-disable-next-line no-console
        p.catch((e) => console.log(e));
      }
    }
    if (onOpen) {
      onOpen();
    }
  };

  const close = () => {
    stateController('shrink');

    video.pause();
    removeElement(video);
    video = undefined;

    if (onClose) {
      onClose();
    }
  };

  return { open, close };
}

export { setAttributes, getAttributes, createPopupPlayer };
