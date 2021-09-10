import { isPortrait } from '@/common/js/media';
import { getWindowHeight } from '@/common/js/media/window-size';
import { CanvasPlayer, ImageSequence, PlayMode } from '@zhinan-oppo/canvas-player';
import { LoadController } from '@zhinan-oppo/load-controller';
import { addScrollListener } from '@zhinan-oppo/scroll-handle';
import { createManualLoader } from './lazyload';

/**
 * @type {Promise<LoadController>}
 */
const controllerCreated = new Promise((resolve) => {
  createManualLoader().then((loader) => {
    resolve(new LoadController(loader, { limit: 6 }));
  });
});

/**
 * @param {HTMLCanvasElement} canvas
 */
function getCanvasPlayerOptions(canvas) {
  const { posterFrame, fps, mode, autoplay, delay, replay, loadGap, waitOnLoading } =
    canvas.dataset;
  const options = {
    posterFrame: posterFrame && parseInt(posterFrame, 10),
    autoplay: autoplay !== undefined,
    replay: replay !== undefined,
    playOptions: {
      fps: fps && parseFloat(fps),
      mode:
        mode === 'reverse'
          ? PlayMode.Reverse
          : mode === 'loop'
          ? PlayMode.Loop
          : mode === 'alternate'
          ? PlayMode.Alternate
          : PlayMode.Normal,
      delay: delay && parseFloat(delay),
      waitOnLoading: waitOnLoading && JSON.parse(waitOnLoading),
    },
    loadGap: loadGap && parseInt(loadGap, 10),
  };
  return options;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('@zhinan-oppo/canvas-player').CanvasPlayerOptions & { loadGap?: number}} options
 * @param {boolean} mobileOnly 是否只在移动端有效
 * @returns {Promise<CanvasPlayer>}
 */
export async function createCanvasPlayer(
  canvas,
  { loadGap, defaultPlayOptions, ...options } = {},
  mobileOnly = false, // 这实际上是一个历史遗留的参数
) {
  if (mobileOnly && !isPortrait()) {
    const fakeFunc = () => {};
    return { play: fakeFunc, seek: fakeFunc, pause: fakeFunc };
  }

  const controller = await controllerCreated;

  const {
    autoplay,
    posterFrame: _posterFrame,
    playOptions: _playOptions,
    replay,
    loadGap: _loadGap,
  } = getCanvasPlayerOptions(canvas);
  if (!loadGap) {
    loadGap = _loadGap || 1;
  }
  const playOptions = { ..._playOptions, ...defaultPlayOptions };

  const images = Array.from(canvas.children);
  const coverIndex = _posterFrame || images.findIndex((image) => image.hasAttribute('data-cover'));
  const posterFrame = coverIndex > 0 ? coverIndex : 0;

  // 这里使用了默认的 loader，实际上不会加载图片只会添加相应的事件监听
  const sequence = new ImageSequence(images);
  /** @type {CanvasPlayer} */
  const player = new CanvasPlayer(canvas, sequence, {
    ...options,
    posterFrame,
    defaultPlayOptions: playOptions,
  });
  player.load();

  let loadFinished = false;
  // 添加到加载队列中
  const group = controller.pushGroup(images, {
    start: posterFrame,
    gap: loadGap,
    // FIXME: LoadController 似乎有 bug，cnt 总是为 1。此处暂不影响功能
    onProgress: ({ cnt, total }) => {
      if (cnt === total) {
        loadFinished = true;
      }
    },
  });

  addScrollListener(canvas, {
    start: 'bottom',
    end: 'top',
    forceInViewBoundary: true,
    handlers: {
      onStateChange({ state }) {
        if (state === 'inView') {
          if (autoplay && player.paused) {
            if (replay) {
              if (playOptions.mode === PlayMode.Normal) {
                player.seekPercent(0);
              } else if (playOptions.mode === PlayMode.Reverse) {
                player.seekPercent(1);
              }
            }
            player.play(playOptions);
          }
        } else {
          if (state === 'after') {
            group.setPriority('low');
          }
          if (autoplay && player.playing) {
            player.pause();
          }
        }
      },
      before({ distance }) {
        if (loadFinished) {
          return 'done';
        }

        // 提前 0.5 屏加载，但优先级不高
        const faraway = distance + getWindowHeight() * 0.5 < 0;
        group.setPriority(faraway ? 'low' : 'normal');
        return undefined;
      },
      inView({ target, distance, total }) {
        if (loadFinished) {
          return 'done';
        }

        if (distance / total > 0.5) {
          const { top, height } = target.getBoundingClientRect();
          if (top + height / 2 < 0) {
            // 当 canvas 本身有一半在上方看不见了就认为它已经出去了，不继续加载
            return group.setPriority('low');
          }
        }
        return group.setPriority('high');
      },
    },
  });
  return player;
}
