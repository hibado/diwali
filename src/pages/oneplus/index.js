import './index.styl';
// import { enableLazyload } from '@/common/js/lazyload';
// import { oneFinishLoading } from '@/common/js/utils/oneplus';
import { PlayMode } from '@zhinan-oppo/canvas-player';
import { query, queryAll } from '../../common/js/dom';
import { createCanvasPlayer } from '../../common/js/canvas-player';

if (__DEV__) {
  // 为了在 pug 文件修改后自动刷新页面
  import(/* webpackChunkName: 'dev.pug' */ './index.pug');
}

// beforeReady();

function createSequencePlayer() {
  return new Promise((resolve, reject) => {
    const laddu = query('.zn-wrapper .laddu');
    const ladduLogo = query('.zn-wrapper .laddu-logo');
    laddu.style.opacity = '0';
    ladduLogo.style.opacity = '0';
    Promise.all([
      createCanvasPlayer(laddu, {
        alpha: true,
        shouldClear: true,
      }),
      createCanvasPlayer(ladduLogo, {
        alpha: true,
        shouldClear: true,
      }),
    ])
      .then(([playerLaddu, playerLadduLogo]) => {
        resolve({
          play: ({ delay, onUpdated, onEnded, keepLast, duration, loop, hasLogo } = {}) => {
            const player = hasLogo ? playerLadduLogo : playerLaddu;
            let timeout;
            player.seek(0);
            if (hasLogo) {
              ladduLogo.style.opacity = '1';
              laddu.style.opacity = '0';
            } else {
              laddu.style.opacity = '1';
              ladduLogo.style.opacity = '0';
            }
            const playSeq = () =>
              player.play({
                onEnded: () => {
                  if (!keepLast) {
                    if (hasLogo) {
                      ladduLogo.style.opacity = '0';
                    } else {
                      laddu.style.opacity = '0';
                    }
                  }
                  if (onEnded) {
                    onEnded();
                  }
                },
                onUpdated: ({ i }) => {
                  if (onUpdated) {
                    onUpdated({ index: i, progress: i / player.seqLength });
                  }
                },
                fps: player.seqLength / ((duration || 1500) / 1000),
                mode: loop ? PlayMode.LOOP : PlayMode.Normal,
              });

            if (delay > 0) {
              clearTimeout(timeout);
              timeout = setTimeout(playSeq, delay);
            } else {
              playSeq();
            }
          },
        });
      })
      .catch((e) => {
        reject(e);
      });
  });
}
export default createSequencePlayer;

// async function handleReady() {
//   // onReady();
//   // enableLazyload();
//   // oneFinishLoading();
//   const player = await createSequencePlayer();
//   player.play({
//     delay: 500,
//     // keepLast: true,
//     onUpdated: (index) => {
//       console.log('index', index);
//     },
//     onEnded: () => {
//       console.log('结束');
//     },
//   });
//   // setTimeout(() => {
//   //   player.play({ hasLogo: true });
//   // }, 5000);
// }

// if (__ONEPLUS__) {
//   $(handleReady);
// } else {
//   handleReady();
// }
