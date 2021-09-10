const { plugins } = require('../babel.config');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        debug: process.env.NODE_ENV === 'debug',
        targets: {
          node: 'current',
        },
      },
    ],
  ],
  plugins,
};
