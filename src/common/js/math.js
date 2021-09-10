export function round(num, length) {
  if (length > 0) {
    const N = 10 ** length;
    return Math.round(num * N + Number.EPSILON) / N;
  }
  return Math.round(num);
}

/**
 * 仿照 shader 中的 mix 函数，将从 0 到 1 的 progress 值拉伸到 start 和 end，例如当进度为 0 到 1 的时候，偏移量从 0 到 200，translateX = mix(0, 200, progress)
 * @param {Number} start 起始值
 * @param {Number} end 结束值
 * @param {Number} progress 进度
 */
export function mix(start, end, progress) {
  if (progress < 0) return start;
  if (progress > 1) return end;
  return start * (1 - progress) + end * progress;
}

/**
 * 更为复杂的拉伸函数，截取进度值的一段，拉伸到另一个范围，例如当进度为 0.2 到 0.5 的时候，透明度从 0 到 1，opacity = stretch(progress, 0.2, 0.5)
 * @param {Number} progress 进度值
 * @param {Number} start 进度的起始值
 * @param {Number} end 进度的结束值
 * @param {Number} targetStart 目标的起始值，默认为 0
 * @param {Number} targetEnd 目标的结束值，默认为 1
 */
export function stretch(progress, start, end, targetStart = 0, targetEnd = 1) {
  if (progress < start) return targetStart;
  if (progress > end) return targetEnd;
  return ((targetEnd - targetStart) / (end - start)) * (progress - start) + targetStart;
}
