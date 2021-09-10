export function createRAFPromise(callbackOrValue) {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      resolve(typeof callbackOrValue === 'function' ? callbackOrValue() : callbackOrValue);
    });
  });
}

export const nextFrame = createRAFPromise;
