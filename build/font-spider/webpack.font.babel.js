import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import merge from 'webpack-merge';

import configure from '../webpack.config';
import { ROOT_PATH } from '../env';
import { BeforeEmitHTMLPlugin } from '../plugins/BeforeEmitHTMLPlugin';

module.exports = async (env = {}, args = {}) => {
  const { plugins, ...configurations } = await configure(env, {
    ...args,
    RAW_IMAGES: true,
  });

  const htmlPlugins = ['bold', 'medium', 'regular'].map(
    (weight) =>
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'templates', `${weight}.pug`),
        filename: `./${weight}.html`,
        chunks: [weight],
        minify: {
          collapseWhitespace: false,
        },
      }),
  );
  const options = merge(configurations, {
    output: {
      path: path.resolve(__dirname, path.relative(ROOT_PATH, configurations.output.path)),
    },
    plugins: [
      // 不需要正常构建过程中的 HTML
      ...plugins.filter(
        (plugin) =>
          !(plugin instanceof HtmlWebpackPlugin) && !(plugin instanceof BeforeEmitHTMLPlugin),
      ),
      new CopyPlugin(
        [
          {
            from: path.resolve(__dirname, './origin-fonts/*.ttf'),
            to: path.resolve(__dirname, './dist/fonts'),
            context: path.resolve(__dirname, './origin-fonts'),
          },
        ],
        { debug: true },
      ),
      ...htmlPlugins,
    ],
  });
  return options;
};
