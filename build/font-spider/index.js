/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs');
const path = require('path');
const fontspider = require('font-spider');

const htmlPaths = ['bold', 'medium', 'regular', 'light']
  .map((f) => path.resolve(__dirname, 'dist', `${f}.html`))
  .filter((file) => fs.existsSync(file));
const fontDir = path.resolve(__dirname, './dist/fonts');
const dstFontDir = path.resolve(__dirname, '../../src/assets/fonts/zh-Hans');

fontspider
  .spider(htmlPaths)
  .then((fonts) => {
    return fontspider.compressor(fonts, { backup: false });
  })
  .then(() => {
    fs.readdir(fontDir, (err, files) => {
      files.forEach((file) => {
        fs.renameSync(`${fontDir}/${file}`, `${dstFontDir}/${file}`);
      });
    });
  });
