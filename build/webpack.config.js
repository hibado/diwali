import { TransWebpackPlugin } from '@zhinan-oppo/trans-webpack-plugin';
import { createProcessor } from '@zhinan-oppo/lazyload-preprocessor';

import fs from 'fs';
import path from 'path';
import { sync as mkdir } from 'mkdirp';
import { ProvidePlugin, DefinePlugin } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import SpeedMeasurePlugin from 'speed-measure-webpack-plugin';
import VueLoaderPlugin from 'vue-loader/lib/plugin';

import { medias, imagePre, attrResolver, imageLoader as getImageLoader } from '../config';
import { parseTsConfigPaths } from './utils/parse-tsconfig-paths';
import { selectTarget } from './utils/select-page';
import { BeforeEmitHTMLPlugin } from './plugins/BeforeEmitHTMLPlugin';
import { ROOT_PATH, SRC_PATH, VENDER_PATH, FOR_ONEPLUS, FOR_OPPO } from './env';
import { prepareHelpers as preparePugHelpers } from './utils/pug-helper';
import { TargetDefault } from './utils/parse-env';
import { PatchBuildPlugin } from './plugins/PatchBuildPlugin';

export default async (webpackEnv = {}, args = {}) => {
  const mode = args.mode || 'production';
  const useRawImages =
    args.rawImages || args.RAW_IMAGES || args.raw_images || args['raw-images'] || false;

  const page = await selectTarget(args.page, args.tgt || args.ta);

  const env = {
    __DEV__: mode !== 'production',
    __DEBUG__: args.debug || false,
    __LANG__: 'zh',
    __AEM__: !!webpackEnv.AEM,
    __OPPO__: FOR_OPPO,
    __ONEPLUS__: FOR_ONEPLUS,
    __PAGE__: page.name,
    ...page.env,
  };
  env.__ZH__ = env.__LANG__ === 'zh';
  env.__EN__ = env.__LANG__ === 'en';
  if (env.__GTM_CATEGORY__ === undefined) {
    env.__GTM_CATEGORY__ = 'Product Details';
  }

  // eslint-disable-next-line no-console
  console.info({ page: page.name, target: page.target, env });

  const imageLoaderOptions = getImageLoader({
    reducePath: env.__AEM__ && env.__OPPO__, // 这个参数为 true 时，会把文件夹层级压缩到一级，如：path/to/img.jpg --> path-to-img.jpg
    shortPath: 2, // 输出的 assets 文件路径会去掉前面的 2 级，如：assets/images/path/to/img.jpg --> path-to-img.jpg
  });

  const pugHelpers = preparePugHelpers({
    ROOT_PATH,
    localeDir: path.resolve(ROOT_PATH, 'locales'),
    lng: env.__LANG__,
    t9nWrapper: env.__AEM__ && env.__ONEPLUS__ && !env.__ZH__,
  });
  const pugData = { ...env, ...pugHelpers };

  const outPage = [page.name, page.target === TargetDefault ? '' : page.target].join('/');
  const pathToDist = `${env.__AEM__ ? 'packages' : 'pages'}/${outPage}`;
  const options = {
    mode,
    entry: {},
    output: {
      filename: '[name]-[hash].js',
      path: path.resolve(ROOT_PATH, 'dist', pathToDist),
      publicPath: env.__AEM__ && env.__ONEPLUS__ ? '{{var:statics_overseas}}/' : './',
    },
    resolve: {
      extensions: ['.ts', '.mjs', '.js', '.json'],
      alias: {
        ...parseTsConfigPaths(ROOT_PATH, 'tsconfig.json'),
        regl: !env.__DEV__ ? 'regl/dist/regl.min.js' : 'regl/dist/regl.js',
      },
    },
    resolveLoader: {
      alias: {
        'image-loader': '@zhinan-oppo/image-loader',
        'image-sizes-loader': '@zhinan-oppo/image-sizes-loader',
      },
    },
    externals: {},
    module: {
      rules: [
        {
          // pug 文件和 vue 中的 template lang="pug" 需要使用不同的 loader
          test: /\.pug$/,
          oneOf: [
            {
              resourceQuery: /^\?vue/,
              loader: 'pug-plain-loader',
              options: {
                doctype: 'html',
                pretty: true,
                data: pugData,
              },
            },
            {
              loader: [
                {
                  loader: 'html-loader',
                  options: {
                    esModule: true,
                    minimize: false,
                    preprocessor: createProcessor(imagePre),
                    attributes: {
                      list: [
                        { tag: 'video', attribute: 'poster', type: 'src' },
                        { attribute: 'src', type: 'src' },
                        { attribute: 'srcset', type: 'srcset' },
                        { attribute: 'data-src', type: 'src' },
                        { attribute: 'data-sizes', type: 'src' },
                        { attribute: 'data-poster', type: 'src' },
                        { attribute: 'data-bg', type: 'src' },
                        { attribute: attrResolver.value, type: 'src' },
                        ...medias.map(({ alias }) => ({
                          attribute: `${attrResolver.value}-${alias}`,
                          type: 'src',
                        })),
                        { attribute: 'data-p-srcset', type: 'srcset' },
                        { attribute: 'data-srcset', type: 'srcset' },
                        ...medias.flatMap(({ alias }) => [
                          { attribute: `data-src-${alias}`, type: 'src' },
                          { attribute: `data-poster-${alias}`, type: 'src' },
                          { attribute: `data-bg-${alias}`, type: 'src' },
                        ]),
                      ],
                      root: '~@@',
                    },
                  },
                },
                {
                  loader: 'pug-html-loader',
                  options: {
                    doctype: 'html',
                    pretty: true,
                    data: pugData,
                  },
                },
              ],
            },
          ],
        },
        {
          test: /\.styl(us)?$/,
          exclude: /node_modules/,
          use: [
            !env.__DEV__ ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
            {
              loader: 'stylus-loader',
              options: {
                stylusOptions: {
                  resolveURL: { nocheck: true },
                  define: Object.entries(env),
                },
              },
            },
            {
              // 将指定 styl 文件中的内容加到每个 styl 文件前，避免了到处 import 全局定义的内容
              // 注意：自动引入的内容中不应包含会实际生成 CSS 样式的内容，应仅包含变量、函数等的定义
              loader: 'style-resources-loader',
              options: {
                patterns: [
                  path.resolve(SRC_PATH, 'common/styles/auto/index.styl'),
                  path.resolve(SRC_PATH, 'pages', page.name, 'auto.styl'),
                ],
              },
            },
          ],
        },
        {
          test: /\.(j|t)s$/,
          loader: 'babel-loader',
          include: [
            path.resolve(ROOT_PATH, 'src'),
            path.resolve(ROOT_PATH, 'config'),
            path.resolve(ROOT_PATH, 'node_modules/@zhinan-oppo'),
          ],
        },
        {
          test: /\.(jpe?g|png|gif|svg|mp4|woff|woff2|eot|ttf)$/i,
          oneOf: [
            {
              test: /.(jpe?g|png|svg)$/i,
              resourceQuery: /no-?minify|raw-?image/i,
              loader: 'file-loader',
              options: {
                esModule: true,
                name: imageLoaderOptions.name,
                context: imageLoaderOptions.context,
              },
            },
            {
              test: /.(jpe?g|png|svg)$/i,
              loader:
                mode === 'development' && useRawImages
                  ? [
                      {
                        loader: 'file-loader',
                        options: { name: '[path][name]-[md5:contenthash:hex:6].[ext]' },
                      },
                    ]
                  : [{ loader: 'image-loader', options: imageLoaderOptions }],
            },
            {
              loader: 'file-loader',
              options: {
                esModule: true,
                name: imageLoaderOptions.name,
                context: imageLoaderOptions.context,
              },
            },
          ],
        },
        {
          test: /\.(zip|pdf|docx?|pptx?|xlsx?)$/i,
          loader: [
            {
              loader: 'file-loader',
              options: {
                esModule: true,
                name: imageLoaderOptions.name,
                context: imageLoaderOptions.context,
              },
            },
          ],
        },
        {
          test: /\.(glsl|vs|fs|vert|frag)$/,
          exclude: /node_modules/,
          use: [
            'raw-loader',
            {
              loader: 'glslify-loader',
              options: {
                transform: ['glslify-hex'],
              },
            },
          ],
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.yaml?$/,
          type: 'json',
          use: ['yaml-loader'],
        },
      ],
    },
    plugins: [
      new VueLoaderPlugin(),
      new CleanWebpackPlugin(),
      new DefinePlugin(
        Object.fromEntries(Object.entries(env).map(([key, value]) => [key, JSON.stringify(value)])),
      ),
    ],
  };

  // 当目标模板中已经引入了 jQuery 时——且需要 jQuery 在我们的 js 文件之前引入，使用 externals 而不是 DefinePlugin
  if (env.__OPPO__) {
    // 如果在 oppo 项目中报了 $ 不存在的情况，可能是 jquery 在我们的 js 后引入了，
    // 改为 ProvidePlugin 即可——或者让 oppo 修改 js 引入顺序
    options.externals.jquery = '$';
  } else {
    // env.__ONEPLUS__
    // 不确定一加的架构里是否已有 jQuery，确定情况和 OPPO 一致的话，可以改为 externals
    options.plugins.push(new ProvidePlugin({ $: 'jquery' }));
  }

  if (page.entry) {
    options.entry.main = page.entry;
  }
  if (page.template) {
    options.plugins.push(
      new HtmlWebpackPlugin({
        template: page.template,
        filename: env.__AEM__ ? 'main-[hash].html' : 'index.html',
        chunks: env.__AEM__ ? [] : ['main'], // AEM 不需要 <script src="main.js">
        minify: false,
      }),
    );

    if (!env.__AEM__) {
      const venderRegion = env.__LANG__ || 'zh';
      const templatePath = path.resolve(VENDER_PATH, `${venderRegion}.html`);
      options.plugins.push(
        new BeforeEmitHTMLPlugin({
          dependencies: [templatePath],
          callback: (html) => {
            const template = fs.readFileSync(templatePath).toString('utf8');
            return template.replace(/<main[^>]*>.*<\/main>/i, html);
          },
        }),
      );
    }
  }

  // production 需要的额外配置
  if (!env.__DEV__) {
    options.plugins.push(
      new MiniCssExtractPlugin({ filename: 'main-[chunkhash].css' }),
      new TransWebpackPlugin({
        keyAttrName: '@t',
        nsAttrName: '@t-ns',
        keyAttrAlias: {
          img: 'data-srcset',
          video: 'src',
        },
        dryRun: !env.__ONEPLUS__ || !env.__AEM__ || !env.__ZH__, // 只有一加正式打包外销站时需要变换
        clean: true,
        namespace: (typeof args.trans === 'string' && args.trans) || undefined,
        wrapKey: (key) => {
          if (/^\{\{t9n:[^{}]*\}\}/.test(key)) {
            return key;
          }
          return `{{t9n:${key}}}`;
        }, // 一加的多语言格式
        outputPath: false, // 设置为 false，则不输出 json 文件
        mergedFilename: 'translations.json',
      }),
    );

    // 在打包交付时生成 assets 记录文件，以便于后续打增量包
    if (env.__AEM__) {
      const historyPath = path.resolve(ROOT_PATH, 'build', '.history', ...outPage.split('/'));
      mkdir(historyPath);

      options.plugins.push(
        new PatchBuildPlugin({
          historyFile: path.resolve(historyPath, 'packages.json'),
          overwritesHistory: env.__AEM__,
          mode: webpackEnv.PATCH ? 'patch' : 'complete',
          historyID: args.history,
          selectHistoryManually: !!args['select-patch'],
        }),
      );
    }
  }

  return new SpeedMeasurePlugin({ disable: !process.env.MEASURE }).wrap(options);
};
