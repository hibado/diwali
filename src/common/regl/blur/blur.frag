#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: blur = require('glsl-fast-gaussian-blur/9')

varying vec2 uv;
uniform sampler2D src;
uniform vec2 direction, iResolution;

void main () {
  gl_FragColor = blur(src, uv, iResolution, direction);
}
