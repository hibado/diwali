module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        debug: process.env.NODE_ENV === 'debug',
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ],
  ],
  plugins: [['@babel/plugin-transform-runtime'], ['@babel/plugin-proposal-class-properties']],
};
