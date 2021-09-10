import path from 'path';
import fs from 'fs';
import { parse } from 'yaml';

function getDefaultValue(type) {
  switch (type) {
    case 'string':
      return '';
    case 'boolean':
      return false;
    case 'number':
    case 'bigint':
      return NaN;
    default:
      throw new TypeError(`type should be one of: ['number', 'string', 'boolean', 'bigint']`);
  }
}

export function collectDefinitions(obj, targetsAllowed = true) {
  const targets = new Set();
  const definitions = new Set();
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const type = typeof value;
    if (targetsAllowed && type === 'object') {
      targets.add(key);
      return collectDefinitions(value, false).definitions.forEach((key) => definitions.add(key));
    }

    if (type === 'number' || type === 'string' || type === 'boolean' || type === 'bigint') {
      definitions.add({ key, type });
    }
    return undefined;
  });
  return { targets, definitions };
}

export const TargetDefault = Symbol('default target');

export function parseEnv(filepath) {
  filepath = path.resolve(filepath);
  if (fs.existsSync(filepath)) {
    const content = parse(fs.readFileSync(filepath).toString());
    const { targets, definitions } = collectDefinitions(content);

    const envs = new Map();
    if (targets.size > 0) {
      targets.forEach((target) => {
        const env = {};
        definitions.forEach(({ key, type }) => {
          env[key] = content[target]?.[key] || content[key] || getDefaultValue(type);
        });
        targets.forEach((key) => {
          env[`__TGT_${key}`] = target === key;
        });
        envs.set(target, env);
      });
    } else {
      const env = {};
      definitions.forEach(({ key, type }) => {
        env[key] = content[key] || getDefaultValue(type);
      });
      envs.set(TargetDefault, env);
    }
    return envs;
  }
  const envs = new Map();
  envs.set(TargetDefault, {});
  return envs;
}
