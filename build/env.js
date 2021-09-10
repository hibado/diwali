/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';

/** @type {String} */
export const ROOT_PATH = path.resolve(__dirname, '..');

/** @type {String} */
export const SRC_PATH = path.resolve(ROOT_PATH, 'src');

export const VENDERS = Object.freeze({ oppo: 'oppo', oneplus: 'oneplus' });

const vendersExist = Object.values(VENDERS).filter((name) => {
  const file = path.resolve(ROOT_PATH, 'vender', name);
  const exists = fs.existsSync(file);
  if (!exists) return false;

  const stats = fs.statSync(file);
  return stats.isDirectory();
});
if (vendersExist.length < 1) {
  throw new Error('在 vender 下必须保留 oppo/ 或 oneplus/');
}
if (vendersExist.length > 1) {
  console.warn(`vender/ 下同时保留了多个有效的目录，但只有一个会生效：${vendersExist[0]}/`);
}

/** @type {String} */
export const VENDER_SELECTED = process.env.CHOOSE_VENDER || vendersExist[0];
/** @type {Boolean} */
export const FOR_OPPO = VENDER_SELECTED === 'oppo';
/** @type {Boolean} */
export const FOR_ONEPLUS = VENDER_SELECTED === 'oneplus';

/** @type {String} */
export const VENDER_PATH = path.resolve(ROOT_PATH, 'vender', VENDER_SELECTED);
