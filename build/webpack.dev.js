import merge from 'webpack-merge';
import webpack from 'webpack';
import path from 'path';
import os from 'os';

// eslint-disable-next-line import/no-extraneous-dependencies
import WriteFilePlugin from 'write-file-webpack-plugin';

import getOptions from './webpack.config';
import { ROOT_PATH } from './env';

const GiB = (2 ** 10) ** 3;

export default async (env, args, ...rest) => {
  args.mode = args.mode || 'development';

  const plugins = [new webpack.HotModuleReplacementPlugin()];
  if (os.totalmem() < 16 * GiB) {
    plugins.push(new WriteFilePlugin());
  }

  const prod = await getOptions(env, args, ...rest);
  return merge(prod, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
      contentBase: path.resolve(ROOT_PATH, 'dist'),
      host: '0.0.0.0',
      port: 9090,
      hot: true,
      index: 'main.html',
      historyApiFallback: true,
      disableHostCheck: true,
    },
    output: {
      filename: 'js/[name]-[hash].js',
      path: path.resolve(ROOT_PATH, 'dist', 'dev'),
      publicPath: '/',
    },
    optimization: {
      namedModules: true,
    },
    plugins,
  });
};
