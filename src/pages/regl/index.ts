import './index.styl';

import createREGL from 'regl';

import { query } from '@/common/js/dom';
import { loadElements } from '@/common/js/lazyload';
import { createBlitCommand } from '@/common/regl/blit';
import windowSize from '@/common/js/media/window-size';

import frag from './filter.frag';

export async function onReady() {
  const root = query('.sampler')!;
  const canvas: HTMLCanvasElement = query(root, 'canvas')!;
  const img = canvas.firstElementChild as HTMLImageElement;

  const pointer = [0, 0];
  window.addEventListener('pointermove', (evt) => {
    pointer[0] = evt.clientX;
    pointer[1] = evt.clientY;
  });

  await loadElements([img]);

  const dpr = window.devicePixelRatio;
  canvas.width = windowSize.width * dpr;
  canvas.height = windowSize.height * dpr;

  const regl = createREGL({ canvas });
  const blit = createBlitCommand(regl);
  const sample = regl({
    frag,
    uniforms: {
      uTime: regl.context('time'),
      uRadius: Math.min(img.width, img.height) / 5,
      uWHRatio: img.width / img.height,
      uPoint: () => [pointer[0], windowSize.height - pointer[1]],
      uResolution: () => [windowSize.width, windowSize.height],
      uTexture: regl.texture({ data: img, flipY: false }),
    },
  });

  const draw = () => {
    blit(() => sample());
  };

  const lastPointer: [number, number] = [-1, -1];
  regl.frame(() => {
    const [x, y] = pointer;
    // if (lastPointer[0] !== x || lastPointer[1] !== y) {
    draw();
    lastPointer[0] = x;
    lastPointer[1] = y;
    // }
  });
}

onReady();
