export function createSlice(seek, { maxN = 6, minToSlice = 0.002 } = {}) {
  let last;
  let requestHandle;
  return (
    /** @type {number} */
    (p) => {
      // console.log('seek', p, last);
      if (!last) {
        last = p;
        return seek(p);
      }
      const diff = p - last;
      let n = Math.min(Math.floor(Math.abs(diff / minToSlice)), maxN);
      if (n < 2) {
        last = p;
        return seek(p);
      }
      const slice = diff / n;
      const values = [];
      let it = last;
      while (n > 1) {
        it += slice;
        values.push(it);
        n -= 1;
      }
      values.push(p);

      const next = () => {
        last = values.shift();
        // console.log('next', last);
        window.cancelAnimationFrame(requestHandle);
        if (values.length > 0) {
          requestHandle = window.requestAnimationFrame(next);
        }
        return seek(last);
      };
      return next();
    }
  );
}
