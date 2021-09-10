import { addScrollListener } from '@zhinan-oppo/scroll-handle';
import { createCanvasPlayer } from '@/common/js/canvas-player';
import { PlayMode } from '@zhinan-oppo/canvas-player';

/**
 * @param {HTMLElement} root
 */
export function controlVideos(root) {
  const videos = root.querySelectorAll('.video');
  videos.forEach(async (element) => {
    if (element.getAttribute('data-cover') !== null) {
      return;
    }
    const player =
      element instanceof HTMLVideoElement ? undefined : await createCanvasPlayer(element);
    const fps = player && (+element.getAttribute('data-fps') || 24);
    const mode = player && (element.getAttribute('data-mode') || PlayMode.Loop);
    addScrollListener(element, {
      handlers: {
        onStateChange({ state }) {
          if (player) {
            if (state === 'inView') {
              if (!player.playing) {
                player.play({ fps, mode });
              }
            } else if (player.playing) {
              player.pause();
            }
          } else if (!player) {
            if (state === 'inView') {
              if (element.readyState >= 3) {
                element.play();
              } else {
                element.setAttribute('autoplay', '');
              }
            } else if (!element.paused) {
              element.pause();
            }
          }
        },
      },
    });
  });
}

export const init = () => {
  const videoConverters = document.querySelectorAll('.g--video-converter');
  videoConverters.forEach((converter) => {
    controlVideos(converter);
  });
};
