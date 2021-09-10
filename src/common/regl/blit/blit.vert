#ifdef GL_ES
precision highp float;
#endif

attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = 0.5 * (position + 1.0);
  gl_Position = vec4(position, 0, 1);
}