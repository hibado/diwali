const { plugins } = require('../babel.config');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
      },
    ],
  ],
  plugins,
};
