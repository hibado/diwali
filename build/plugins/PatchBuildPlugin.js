/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import fs from 'fs';
import path from 'path';
import { sync as mkdir } from 'mkdirp';
import semver from 'semver';
import select from 'cli-select';

function parseHistoryFile(historyFile) {
  if (!historyFile) {
    throw new Error(`historyFile 参数是必须的，但传入了：${historyFile}`);
  }

  if (fs.existsSync(historyFile) && !fs.statSync(historyFile).isFile()) {
    throw new Error(`historyFile 必须是一个 json 文件：${historyFile}`);
  }

  /** @type {Array<{ id: string; mode: string; version: string; assets: string[]; createdAt: string; }>} */
  const histories = fs.existsSync(historyFile) ? require(historyFile) : [];

  /** @type {string} */
  const lastVersion = histories[histories.length - 1]?.version || '0.0.0';
  return { histories, lastVersion };
}

export class PatchBuildPlugin {
  constructor({
    historyFile,
    historyID,
    maxNumHistories = 10,
    overwritesHistory = true,
    mode = 'patch',
    selectHistoryManually = false,
  }) {
    this.historyFile = historyFile;
    this.overwritesHistory = overwritesHistory;
    this.mode = mode;
    this.historyID = historyID;
    this.maxNumHistories = maxNumHistories;
    this.selectHistoryManually = selectHistoryManually;
  }

  apply(compiler) {
    const historyFile = this.historyFile;

    const id = Date.now().toString();

    const { histories, lastVersion } = parseHistoryFile(historyFile);
    const version = semver.inc(lastVersion, this.mode === 'patch' ? 'minor' : 'major');

    const emittedAssets = [];
    const logger = compiler.getInfrastructureLogger(PatchBuildPlugin.name);

    // 给 output.path 加上版本信息
    compiler.hooks.environment.tap(PatchBuildPlugin.name, () => {
      compiler.options.output.path += `_v${version}`;
    });

    if (this.mode === 'patch') {
      compiler.hooks.done.tap(PatchBuildPlugin.name, (stats) => {
        if (!stats.hasErrors()) {
          logger.info(`共打包了 ${emittedAssets.length} 个变动文件`);
        }
      });
    }

    compiler.hooks.emit.tapAsync(PatchBuildPlugin.name, (compilation, callback) => {
      const run = async () => {
        // 出错了的话就啥也不做
        if (compilation.getStats().hasErrors()) {
          return callback();
        }

        let patchedVersion;
        const assetNames = Object.keys(compilation.assets);
        if (this.mode === 'patch') {
          const { historyID } = this;
          let history = (historyID && histories.find(({ id }) => id === historyID)) || undefined;

          // 手动选择
          if (!history && histories.length > 0) {
            history = histories[histories.length - 1];

            if (this.selectHistoryManually) {
              console.info('\n选择一个版本作为增量包构建基础：\n');

              try {
                const selectResult = await select({
                  values: histories,
                  valueRenderer: ({ version, createdAt }) =>
                    `v${version} (${new Date(createdAt).toLocaleString()})`,
                  defaultValue: histories.length - 1,
                  cleanup: false,
                });
                history = selectResult.value;

                logger.info(`选中了 v${history.version} 作为增量包构建基础`);
              } catch {
                console.warn(`未选择，默认使用上一个版本作为增量包构建基础`);
              }
            }
          }

          if (history) {
            patchedVersion = history.version;
            assetNames.forEach((key) => {
              if (history.assets.includes(key)) {
                delete compilation.assets[key];
              } else {
                emittedAssets.push(key);
              }
            });
          } else {
            emittedAssets.push(...assetNames);
          }
        }

        const { mode, maxNumHistories } = this;
        const parsedOutputPath = path.parse(historyFile);
        mkdir(parsedOutputPath.dir);

        histories.push({
          id,
          mode,
          version,
          patchedVersion,
          createdAt: new Date(Date.now() + 3.6e6 * 8).toISOString().replace(/Z$/i, '+0800'),
          assets: assetNames,
        });

        // 记录太多了，将旧的备份
        if (histories.length >= maxNumHistories) {
          const backup = histories.splice(0, histories.length - Math.trunc(maxNumHistories / 2));

          fs.writeFileSync(
            path.resolve(
              parsedOutputPath.dir,
              `${parsedOutputPath.name}-${id}${parsedOutputPath.ext}`,
            ),
            Buffer.from(JSON.stringify(backup, undefined, 2)),
          );
        }

        fs.writeFileSync(historyFile, Buffer.from(JSON.stringify(histories, undefined, 2)));

        return callback();
      };
      run();
    });
  }
}
