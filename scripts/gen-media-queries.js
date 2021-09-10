import fs from 'fs';
import path from 'path';
import {
  medias,
  combineSortedMediaQueries,
  getOrientationQuery,
  getAndQuery,
} from '../config/medias';

const output = path.resolve(__dirname, '../src/common/styles/auto/media.gen.styl');
const lines = [
  '/**',
  ` * [${new Date()}]`,
  ` * 本文件由 ${path.relative(output, __filename)} 生成，请勿直接修改`,
  ' */\n',
];

const mediaGroups = new Map();
medias.forEach((media) => {
  const { orientation = 'default', alias, ratio } = media;
  lines.push(`$ratio-${alias} = ${ratio}`);

  const group = mediaGroups.get(orientation) || [];
  group.push(media);
  mediaGroups.set(orientation, group);
});
lines.push('');

mediaGroups.forEach((group, key) => {
  const preQuery = key === 'default' ? undefined : getOrientationQuery(key);
  if (preQuery) {
    lines.push(`$_${key} = '${preQuery}'`);
  }
  const queries = combineSortedMediaQueries(group);
  queries.forEach(({ name, value }) => {
    const q = getAndQuery(preQuery, value);
    lines.push(`$${name} = '${q}'`);
    lines.push(`$not-${name} = 'not screen and ${q}'`);
    lines.push(`$${name}-width = '${preQuery ? value : q}'`);
  });
});

fs.writeFileSync(output, `${lines.join('\n')}\n`);
