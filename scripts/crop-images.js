const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { promisify } = require('util');
const { argv } = require('yargs');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
// const readFile = promisify(fs.readFile);

const { left, top, width, height, out, dir, format } = argv;

async function fromDir() {
  const files = await readdir(dir);
  return Promise.all(
    files.map(async (filename) => {
      const inFile = path.join(dir, filename);
      const stats = await stat(inFile);
      if (!stats.isFile()) {
        return console.warn(`${inFile} is not a file`);
      }
      try {
        const img = sharp(inFile);
        const stats = await img.metadata();
        if (!['png', 'jpeg'].includes(stats.format)) {
          return console.warn(`Unsupported format: ${stats.format} ${inFile}`);
        }
        const { name } = path.parse(filename);
        const outFormat = format || stats.format;
        const outFile = path.join(out, `${name}.${outFormat}`);
        await img
          .extract({ left, top, width, height })
          .resize({ width, height })
          .toFormat(outFormat, { quality: 100 })
          .toFile(outFile);
        console.log(`${inFile} => ${outFile}`);
      } catch (e) {
        console.error(e);
      }
      return undefined;
    }),
  );
}

fromDir();
