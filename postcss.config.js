import autoprefixer from 'autoprefixer';
import respUnit from '@zhinan-oppo/postcss-rpx';
import unit2var from '@zhinan-oppo/postcss-unit2var';

import {
  combineSortedMediaQueries,
  getMaxWidthQuery,
  getMinWidthQuery,
  medias,
} from './config/medias';
import { round } from './src/common/js/math';
import { FOR_OPPO } from './build/env';

const mediaQueries = combineSortedMediaQueries(medias);

const respUnitOptions = {
  medias: mediaQueries.map(({ name, value }, i) => {
    const { ratio } = medias[i];
    return {
      alias: name,
      query: value,
      ratio,
    };
  }),
  clearOptionProps: process.env.NODE_ENV !== 'development',
};

const plugins = [
  respUnit(
    FOR_OPPO
      ? {
          to: 'px',
          round: Math.round,
          from: 'rpx',
          defaultRuleOptions: { medias: [{ alias: '1920' }, { alias: '1440' }, { alias: '1024' }] },
          ...respUnitOptions,
        }
      : {
          // FOR_ONEPLUS
          // rpx 也通过 vw 进行整体缩放
          to: 'vw',
          round: (px) => round((px / 1920) * 100, 4),
          from: 'rpx',
          defaultRuleOptions: { medias: [{ alias: '1920' }] },
          ...respUnitOptions,
          medias: (() => {
            const media1920 = respUnitOptions.medias.find(({ alias }) => alias === '1920');
            return [{ ...media1920, ratio: 1, query: getMinWidthQuery(1024) }];
          })(),
        },
  ),
  unit2var({ from: 'vw', to: '--vw', fallback: '1vw' }),
  // 将 mpx 的转换放到 vw 转换的后面，避免了移动端部分不必要的 vw 转换——移动端没有滚动条占位的影响
  respUnit({
    ...respUnitOptions,
    to: 'vw',
    round: (px) => round((px / 360) * 100, 3),
    from: 'mpx',
    defaultRuleOptions: {
      medias: [{ alias: '360' }],
    },
    medias: (() => {
      const media360 = respUnitOptions.medias.find(({ alias }) => alias === '360');
      return [{ ...media360, ratio: 1, query: getMaxWidthQuery(1023) }];
    })(),
  }),
  unit2var({ from: 'vh', to: '--vh', fallback: '1vh' }),
  autoprefixer(),
  // 'postcss-import': {},
  // 'postcss-cssnext': {},
  // 'cssnano': {}
];

export { plugins };
