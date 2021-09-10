import path from 'path';
import fs from 'fs';
import { parse as parseYAML, stringify as stringifyYAML } from 'yaml';

import { parseEnv } from '../build/utils/parse-env';

const { argv } = require('yargs');

const eslintGlobalsToIgnore = [
  '__DEBUG__',
  '__DEV__',
  '__AEM__',
  '__OPPO__',
  '__ONEPLUS__',
  '__LANG__',
  '__ZH__',
  '__EN__',
  '__GTM_PRODUCT__',
  '__GTM_CATEGORY__',
];

/**
 * @param {string} inputFile
 * @param {string} outputDir 默认为 envFile 所在文件夹
 * @returns
 */
function prepareParams(inputFile, outputDir) {
  const stats = fs.statSync(inputFile);
  if (!stats.isFile()) {
    throw new Error(`非法文件：${inputFile}`);
  }
  if (!outputDir) {
    outputDir = path.dirname(inputFile);
  }
  return { envFile: inputFile, outputDir };
}

/**
 * @param {Map<string|symbol, Record<string, unknown>>} envs
 * @returns {{key: string; values: unknown[]}}
 */
function mergeEnvs(envs) {
  /** @type {Record<string, Set<unknown>>} */
  const merged = {};
  envs.forEach((env) => {
    Object.keys(env).forEach((key) => {
      if (!merged[key]) {
        merged[key] = new Set();
      }
      merged[key].add(env[key]);
    });
  });
  return Object.keys(merged)
    .sort()
    .map((key) => {
      const values = Array.from(merged[key].values());
      return { key, values };
    });
}

const GENERATED_FLAG = '__AUTO_GENERATED__';

/**
 * @param {string} outputDir
 * @param {{key: string; values: unknown[]}} envs
 */
function generateTSD(outputDir, envs) {
  const typeDir = path.resolve(outputDir, '@types');
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir);
  } else if (!fs.statSync(typeDir).isDirectory()) {
    throw new Error(`${typeDir} 不是文件夹`);
  }

  const output = path.resolve(typeDir, 'env.yaml.d.ts');

  const lines = [
    '/**',
    ` * 本文件由 ${path.relative(output, __filename)} 生成，请勿直接修改`,
    ' */\n',
    '/* eslint-disable */',
  ];

  envs.forEach(({ key, values }) => {
    lines.push(
      `declare const ${key}: ${values
        .map((v) => (Number.isNaN(v) ? 'NaN' : JSON.stringify(v)))
        .join(' | ')}; // ${GENERATED_FLAG}`,
    );
  });

  fs.writeFileSync(output, `${lines.join('\n')}\n`);
}

/**
 * @param {string} outputDir
 * @param {{key: string; values: unknown[]}} envs
 */
function generateEslintGlobals(outputDir, envs) {
  const output = path.resolve(outputDir, '.eslintrc.yaml');
  let conf = { globals: {} };
  if (fs.existsSync(output)) {
    const content = fs.readFileSync(output).toString();
    const filtered = content.replace(
      new RegExp(`\\n[^\\n]*${GENERATED_FLAG}[^\\n]*(\\n|$)`, 'g'),
      '\n',
    );
    conf = parseYAML(filtered) || { globals: {} };
    const globals = {};
    if (conf.globals) {
      Object.keys(globals).forEach((key) => {
        globals[key] = conf.globals[key];
      });
    }
    conf.globals = globals;
  }

  const value = `readonly ${GENERATED_FLAG}`;
  envs.forEach(({ key }) => {
    if (!eslintGlobalsToIgnore.includes(key)) {
      conf.globals[key] = value;
    }
  });

  const yaml = stringifyYAML(conf);
  fs.writeFileSync(
    output,
    [
      `此文件中的 globals 经过 ${path.relative(output, __filename)} 根据 .env.yaml 处理：`,
      '  请勿删除 __AUTO_GENERATED__ 注释，脚本根据此注释判断字段是否由脚本生成；',
      '  手动添加的字段不受影响，在重新生成的过程中会被保留。',
    ]
      .map((line) => `# ${line}`)
      .join('\n'),
  );
  fs.appendFileSync(output, '\n\n');
  fs.appendFileSync(output, yaml.replace(new RegExp(GENERATED_FLAG, 'g'), `# ${GENERATED_FLAG}`));
}

const inputFile = argv.page
  ? path.resolve(__dirname, '..', 'src', 'pages', argv.page, '.env.yaml')
  : path.resolve(argv._[0]);

const { envFile, outputDir } = prepareParams(inputFile);
const envs = mergeEnvs(parseEnv(envFile));

generateTSD(outputDir, envs);
generateEslintGlobals(outputDir, envs);
