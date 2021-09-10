import frag from './blur.frag';

/**
 * @param {import('regl')} regl
 */
export function createBlurCommand(regl) {
  const command = regl({
    frag,
    uniforms: {
      iResolution: ({ viewportWidth, viewportHeight }) => [viewportWidth, viewportHeight],
      src: regl.prop('src'),
      direction: regl.prop('direction'),
    },
    framebuffer: regl.prop('dst'),
  });

  return (...args) => {
    command(...args);
  };
}
