import HtmlWebpackPlugin from 'html-webpack-plugin';

export class BeforeEmitHTMLPlugin {
  constructor({ callback = undefined, dependencies = [] } = {}) {
    this.callback = callback;
    this.dependencies = dependencies;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(BeforeEmitHTMLPlugin.name, (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        BeforeEmitHTMLPlugin.name,
        (data, cb) => {
          if (typeof this.callback === 'function') {
            data.html = this.callback(data.html);
          }
          cb(null, data);
        },
      );
    });
  }
}
