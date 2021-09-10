export function canIUseCSSVar() {
  return window.CSS && window.CSS.supports('height', 'var(--vh)');
}

export function canIUseClipPath(value = 'inset(0 0 0 0 round 1px)') {
  if (!window.CSS) {
    return false;
  }
  const supported = ['clip-path', '-webkit-clip-path'].find((prop) =>
    window.CSS.supports(prop, value),
  );
  if (!supported) {
    return false;
  }
  return supported;
}

type WebPFeatures = 'lossy' | 'lossless' | 'alpha' | 'animation';
const webpPromises: Record<WebPFeatures, Promise<WebPFeatures | false | undefined> | undefined> = {
  lossy: undefined,
  lossless: undefined,
  alpha: undefined,
  animation: undefined,
};

export function canIUseWebP(feature: WebPFeatures = 'alpha') {
  if (!webpPromises[feature]) {
    const kTestImages = {
      lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
      lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
      alpha:
        'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==',
      animation:
        'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA',
    };

    webpPromises[feature] = new Promise((resolve) => {
      const img = new Image();
      img.onload = function () {
        const result = img.width > 0 && img.height > 0;
        resolve(result && feature);
      };
      img.onerror = function () {
        resolve(undefined);
      };
      img.src = `data:image/webp;base64,${kTestImages[feature]}`;
    });
  }
  return webpPromises[feature];
}
