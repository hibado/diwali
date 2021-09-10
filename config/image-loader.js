import * as path from 'path';

const prePath = path.resolve(__dirname, '..', '.cache', 'image-loader');
const context = path.resolve(__dirname, '..', 'src', 'assets');

export default function ({
  shortPath = false,
  reducePath = false,
  errorInputNotFound = false,
  prefix = 'assets/',
} = {}) {
  return {
    context,
    errorInputNotFound,
    name:
      process.env.NODE_ENV === 'development'
        ? '[path][name]_[width]@[ratio]-[md5:contenthash:hex:6].[ext]'
        : (resourcePath) => {
            const relativePath = path.relative(context, resourcePath);
            const { dir } = path.parse(relativePath);
            const dirSegments = dir.split('/').slice(shortPath || 0);
            const destDir = dirSegments.map((seg) => `${seg}${reducePath ? '-' : '/'}`).join('');
            return `${prefix}${destDir}[name]-[md5:contenthash:hex:6].[ext]`;
          },
    quality: 75, // 这里的 quality 以及 query 中的 quality 都会覆盖 webp.quality
    qualityRaw: 80, // 输出的 JPG/PNG 的默认压缩质量
    output: prePath,
    input: prePath,
    ratios: [1],
    webpOnly: process.env.NODE_ENV === 'development',
    webp: {
      // https://github.com/imagemin/imagemin-webp#options
      // quality: 75, // 会被覆盖，干脆不设置
      alphaQuality: 100,
      // 此处设置为 6 对构建速度影响还是挺大的，不过图片大小的差异也是明显的
      // 测试时选用了一张 2560x1200 的 JPG 图片，设置为 6 时输出的 WebP 大小约为 131KB，设置为 4 时输出的大小约为 141KB
      method: 6, // 0~6，0 最快，6 最慢
      lossless: false,
      crop: undefined, // { x: number, y: number, width: number, height: number }
      resize: undefined, // { width: number, height: number }
    },
  };
}
