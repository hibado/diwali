import fs from 'fs';
import path from 'path';
import select from 'cli-select';
import { parseEnv, TargetDefault } from './parse-env';

const ROOT = path.resolve(__dirname, '../..');
const PAGE_DIR = path.resolve(ROOT, 'src', 'pages');
const ENTRY_FILES = ['index.ts', 'index.js'];
const TEMPLATE_FILES = ['index.pug', 'template.pug'];

function findEntryFile(dir) {
  return ENTRY_FILES.find((file) => fs.existsSync(path.resolve(dir, file)));
}
function findTemplateFile(dir) {
  return TEMPLATE_FILES.find((file) => fs.existsSync(path.resolve(dir, file)));
}

/**
 * @param {*} dir
 */

function findPages(dir) {
  const files = fs
    .readdirSync(dir)
    .map((name) => {
      if (!/^\./.test(name)) {
        const cur = path.resolve(dir, name);
        const entryFilename = findEntryFile(cur);
        const templateFilename = findTemplateFile(cur);

        return {
          name,
          dir: cur,
          entry: entryFilename && path.resolve(cur, entryFilename),
          template: templateFilename && path.resolve(cur, templateFilename),
        };
      }
      return undefined;
    })
    .filter(Boolean)
    .filter(({ entry, template }) => entry || template);

  return files;
}

/**
 * @typedef {{name:string;dir:string;entry:string;template:string;env:Record<string,any>}} Target
 * @param {string} page
 * @returns {Promise<Omit<Target, 'env'>>}
 */
export async function selectPage(page) {
  const pages = findPages(PAGE_DIR);
  const found = page && pages.find(({ name }) => name === page);
  if (found) {
    return found;
  }
  if (pages.length === 1) {
    return pages[0];
  }
  return new Promise((resolve) => {
    // eslint-disable-next-line no-console
    console.info('选择一个页面：');
    select({ values: pages, valueRenderer: ({ name }) => name }, ({ id, value }) => {
      if (id !== null) {
        return resolve(value);
      }
      throw new Error('必须选择一个可用的选项');
    });
  });
}

/**
 * @param {string} pageName
 * @param {string} envName
 * @returns {Promise<Target>}
 */
export async function selectTarget(pageName, envName) {
  const page = await selectPage(pageName);
  const envs = parseEnv(path.resolve(page.dir, '.env.yaml'));
  const namedEnvs = Array.from(envs.entries())
    .map(([name, env]) => {
      return { name, env };
    })
    .filter(({ name }) => name !== TargetDefault);
  let found =
    namedEnvs.length < 1
      ? { name: TargetDefault, env: envs.get(TargetDefault) }
      : { name: envName, env: envs.get(envName) };

  if (!found || !found.name || !found.env) {
    // eslint-disable-next-line no-console
    console.info(`选中的页面为: ${page.name}；再选择输出目标: `);
    found = await new Promise((resolve, reject) => {
      select(
        {
          values: namedEnvs,
          valueRenderer: ({ name }) => `${name}\t(${page.name}/${name})`,
        },
        ({ id, value }) => {
          if (id !== null) {
            return resolve(value);
          }
          return reject(new Error('必须选择一个可用的选项'));
        },
      );
    });
  }

  return {
    ...page,
    env: found.env,
    target: found && found.name,
  };
}
