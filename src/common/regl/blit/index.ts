import type { Regl } from 'regl';

import vert from './blit.vert';

export function createBlitCommand(regl: Regl, frag?: string) {
  return regl({
    vert,
    attributes: { position: [-3, 1, 1, 1, 1, -3] },
    depth: { enable: false },
    count: 3,
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha',
      },
    },
    primitive: 'triangles',
    ...(frag ? { frag } : {}),
  });
}
