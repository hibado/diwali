import { medias } from './medias';

const portraitMedias = medias.filter(({ alias }) => ['360', '768'].includes(alias));
const maxPortraitRatio = portraitMedias.reduce((prev, { ratio }) => Math.max(prev, ratio), 0.1);

export default {
  '@src': {
    type: 'src',
    baseRatio: 1,
    medias: medias.filter((media) => !portraitMedias.includes(media)),
    transformSizesRequest: ({ url, query }) => ({
      url,
      query: { ...query, ImageSizes: true, media: '@src' },
    }),
  },
  '@src-p': {
    type: 'src',
    baseRatio: 1,
    medias: portraitMedias.map(({ ratio, ...rest }) => ({
      ratio: ratio / maxPortraitRatio,
      ...rest,
    })),
    transformSizesRequest: ({ url, query: { presets, ...query } }) => ({
      url,
      query: {
        ...query,
        presets: { ...presets },
        ImageSizes: true,
        media: '@src-p',
      },
    }),
  },
  // '@src-all': {
  //   baseRatio: 1,
  //   medias,
  //   type: 'src',
  //   transformSizesRequest: ({ url, query: { presets, ...query } }) => ({
  //     url,
  //     query: {
  //       ...query,
  //       presets: { ...presets },
  //       ImageSizes: true,
  //       media: '@src-all',
  //     },
  //   }),
  // },
  '@poster': {
    medias,
    type: 'src',
    defaultDstAttr: 'data-poster',
  },
  '@bg': {
    medias: medias.filter((media) => !portraitMedias.includes(media)),
    type: 'src',
    defaultDstAttr: 'data-bg',
  },
  '@bg-p': {
    medias: portraitMedias,
    type: 'src',
    defaultDstAttr: 'data-bg',
  },
  default: {
    medias,
    baseRatio: 1,
    type: 'src',
    transformSrcRequest: ({ url, ratios, query }) => ({
      url,
      query: { ...query, ratios },
    }),
    transformSizesRequest: ({ url, query }) => ({
      url,
      query: { ...query, ImageSizes: true },
    }),
  },
};
