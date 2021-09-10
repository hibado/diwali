/**
 * @typedef Media
 * @property {number} ratio 用于确定剪裁图片的大小
 * @property {'landscape'|'portrait'} orientation
 * @property {{min: number}|{max: number}} width
 * @property {string} alias
 */

/**
 * 从前向后匹配，**顺序会影响**匹配结果
 * @type {Media[]}
 */
const _medias = [
  {
    ratio: 1,
    width: { min: 1800 }, // 至少 1800，防止 16 寸 MacBook 适配出问题
    alias: '1920',
  },
  {
    ratio: 0.8384,
    width: { min: 1400 },
    alias: '1440',
  },
  {
    ratio: 0.6829,
    width: { min: 1024 },
    alias: '1024',
  },
  {
    ratio: 0.8,
    width: { min: 721 },
    alias: '768',
  },
  {
    ratio: 0.4,
    width: { max: 720 },
    alias: '360',
  },
];

/**
 * @param {'portrait'|'landscape'} orientation
 */
export function getOrientationQuery(orientation) {
  return `(orientation: ${orientation})`;
}

export function getAndQuery(a, b) {
  return a && b ? `${a} and ${b}` : a || b || '';
}

/**
 * @typedef MinWidth
 * @property {number} min
 * @typedef MaxWidth
 * @property {number} max
 */

export function getMinWidthQuery(min) {
  return `(min-width: ${min}px)`;
}
export function getMaxWidthQuery(max) {
  return `(max-width: ${max}px)`;
}

/**
 * @param {object} width
 * @param {number} width.min
 * @param {number} width.max
 */
export function getWidthQuery(width) {
  const { min, max } = width;
  const minDefined = typeof min !== 'undefined';
  const maxDefined = typeof max !== 'undefined';
  return minDefined && maxDefined
    ? getAndQuery(getMinWidthQuery(min), getMaxWidthQuery(max))
    : minDefined
    ? getMinWidthQuery(min)
    : maxDefined
    ? getMaxWidthQuery(max)
    : '';
}

function hasMax({ max }) {
  return typeof max !== 'undefined';
}

/**
 * @param {Media[]} medias
 * @param {string?} preQuery
 * @returns {Array<{ name: string; value: string }>} queries
 */
export function combineSortedMediaQueries(medias, preQuery) {
  const queries = [];
  let min;
  let max;
  medias.forEach(({ width, alias }) => {
    let w;
    if (hasMax(width)) {
      w = { min, max: width.max };
      min = width.max + 1;
    } else {
      w = { min: width.min, max };
      max = width.min - 1;
    }
    queries.push({ name: alias, value: getAndQuery(preQuery, getWidthQuery(w)) });
  });
  return queries;
}

export const medias = _medias;

export const lazyloadMedias = medias;

export default medias;
