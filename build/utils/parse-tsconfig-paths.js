import path from 'path';
import fs from 'fs';
import { parse as parseJSON } from 'comment-json';

export function parseTsConfigPaths(dir, filename = 'tsconfig.json') {
  const json = parseJSON(fs.readFileSync(path.resolve(dir, filename)).toString()) || {};
  const entries = Object.entries(json?.compilerOptions?.paths || {});

  const alias = new Map();
  entries.forEach(([key, paths]) => {
    const exactly = !/\*+$/.test(key);
    if (!exactly) {
      key = key.replace(/\/\*+$/, '');
      paths[0] = paths[0].replace(/\/\*+$/, '');
    } else {
      key = `${key}$`;
    }
    if (paths[0]) {
      alias.set(key, path.resolve(dir, paths[0]));
    }
  });
  // console.log(Object.fromEntries(alias.entries()));
  return Object.fromEntries(alias.entries());
}
