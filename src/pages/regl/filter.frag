#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uTexture;
uniform float uWHRatio, uRadius, uTime;
uniform vec2 uPoint, uResolution;

varying vec2 vUv;

vec3 grayscale(vec3 rgb) {
  return vec3(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
}

vec3 diff(vec3 bg, vec3 fg) {
  return fg - bg;
}

float uvInCircle(vec2 uv) {
  float dist = distance(uv * uResolution, uPoint);
  return dist - uRadius;
}

float randomNoise(vec2 co) {
  highp float a = 12.9898;
  highp float b = 78.233;
  highp float c = 43758.5453;
  highp float dt= dot(co.xy ,vec2(a,b));
  highp float sn= mod(dt,3.14);
  return fract(sin(sn) * c);
}

float randomNoise(float seed) {
  return randomNoise(vec2(seed, 1.0));
}


#define LINE_AMOUNT 0.05
#define LINE_THRESHOLD 0.2
#define BLOCK_SIZE vec2(8)
vec2 glitch(vec2 uv) {
  float p = sin(uTime) * 0.5 + 0.5;

  // scan line
  float strength = p * LINE_AMOUNT;
  float ySeg = floor(uv.y * 800.); // 控制扫描条纹的高度
  float jitter = randomNoise(vec2(ySeg, uTime / 20.)) * 2. - 1.;
  jitter *= step(LINE_THRESHOLD, abs(jitter)) * strength;
  vec2 uv1 = uv + vec2(jitter, 0);

  // block
  float pt = floor(uTime * 16.67); // 控制 block 维持的时间
  float blockNoise = randomNoise(floor(uv1 * BLOCK_SIZE) * pt) ;
  float displaceNoise = step(.4, pow(blockNoise, 8.0) * pow(blockNoise, 3.0));
  float maxOffset = 0.05 * step(p, .99);
  vec2 offset2 = vec2(
    displaceNoise * maxOffset * randomNoise(7.0),
    displaceNoise * maxOffset * randomNoise(13.0)
  );

  return uv1 + offset2;
}

void main() {
  float ratio = uWHRatio * (uResolution.y / uResolution.x);
  vec2 uv = vec2(vUv.x, 1.0 - ((vUv.y - 0.5) * ratio + 0.5));
  if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)
    discard;

  vec2 glitchedUV = glitch(uv);
  vec3 color;
  if (uvInCircle(vUv) <= 0.0) {
    color = texture2D(uTexture, uv).rgb;
    color = diff(grayscale(color), vec3(1));
  } else {
    color = texture2D(uTexture, glitchedUV).rgb;
  }

  gl_FragColor = vec4(color, 1);
}
