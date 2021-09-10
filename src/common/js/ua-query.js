const { userAgent } = window.navigator;

export const isAndroid = /android/i.test(userAgent);
export const isUc = /UCBrowser/i.test(userAgent);
export const isQQ = /QQBrowser/i.test(userAgent);
export const isWx = /MicroMessenger/i.test(userAgent);
export const isIOS = /iPad|iPhone|iPod/.test(userAgent);
export const isChrome = /Chrome/i.test(userAgent);
export const isIE = Boolean(window.document.documentMode);

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log({
    isAndroid,
    isUc,
    isQQ,
    isWx,
    isIOS,
    isChrome,
    isIE,
  });
}
