/**
 * 仅供 eslint-import-resolver-webpack 使用。
 * 注意：导出的配置函数应是同步的：https://github.com/import-js/eslint-plugin-import/issues/883
 */

require('@babel/register');

const { parseTsConfigPaths } = require('./build/utils/parse-tsconfig-paths');

module.exports = {
  resolve: {
    extensions: ['.ts', '.mjs', '.js', '.json'],
    alias: {
      ...parseTsConfigPaths(__dirname, 'tsconfig.json'), // 解析 tsconfig.json 中的 paths 以避免重复定义
    },
  },
  target: ['web', 'es5'],
};
