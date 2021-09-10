## 多语言 trans-key 提取

使
用[@zhinan-oppo/tran-webpack-plugin](https://github.com/zhinan-oppo/snowball/tree/develop/packages/trans-webpack-plugin)

### 工作方式

- 在`HtmlWebpackPlugin`输出 HTML 文件前，对带有特定属性的标签进行处理
  - 提取需要翻译的内容，并使用`@lang('xxx')`替换
  - 将指定的`key`和`value`（需要翻译的内容）以`JSON`格式保存到文件中

### webpack 配置

```javascript
// webpack.common.js

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { TransWebpackPlugin } = require('@zhinan-oppo/trans-webpack-plugin');

module.exports = () => {
  return {
    plugins: [
      new HtmlWebpackPlugin({}),
      // 需要在 HtmlWebpackPlugin 之后添加
      new TransWebpackPlugin({
        namespace,            // trans-key 的统一前缀，默认不添加前缀
        outputPath,           // 翻译内容输出目录，默认为 output.path
        mergedFilename,       // 是否将所有 HTML 中的翻译内容合并到一个新的 JSON 文件中
        keyAttrName = 't-key',// 通过该属性确定 trans-key
        nsAttrName = 't-ns',  // 通过该属性为子节点添加前缀
        dryRun = false,       // 如果为 true，则不替换内容且不输出文件，只检查 trans-key 是否重复
        wrapKey = (key) => `@lang('${key}')`, // trans-key 以何种格式替换需翻译内容
        keyAttrAlias = { img: 'src', video: 'src' }, // 默认所有元素都提取元素的 content 作为翻译内容，在此设置的元素会默认提取设定的 attribute 内容作为翻译内容
      })
    ]
  }
}
```

### 使用

以 parameter.html 为例

#### 提取翻译前的 HTML

```pug
#parameter(t-ns="#param")
  .contents(t-ns="contents")
    div(t-key="plain") plain
    div(t-key="has-tag") first line#[br.newline]second line
    a(t-key="link" t-key:href="key-of-href" href="https://oppo.com") this is a link
    // 由于默认的 keyAttrAlias 中的设置，此处 t-key 相当于 t-key:src
    img(t-key="img-key-of-src" src="~@@/images/home/kv/image_360.png")
    // 通过 t-key:[attrName] 可以提取任意指定属性的内容
    img(t-key:src="another-img-key-of-src" src="~@@/images/home/kv/image_360.png")

```

```html
// 提取翻译前的 HTML
<div id="parameter" t-ns="#param">
  <div class="contents" t-ns="contents">
    <div t-key="plain">plain</div>
    <div t-key="has-tag">first line<br class="newline" />second line</div>
    <a t-key="link" t-key:href="key-of-href" href="https://oppo.com">this is a link</a
    ><img
      src="images/home/kv/image_360-da7114c030c216408fb9cf35e6e50693.png"
      t-key:src="img-key-of-src"
    /><img
      t-key:src="another-img-key-of-src"
      src="images/home/kv/image_360-da7114c030c216408fb9cf35e6e50693.png"
    />
  </div>
</div>
```

#### 提取翻译后的 HTML

```html
<div id="parameter">
  <div class="contents">
    <div>@lang('#param.contents.plain')</div>
    <div>@lang('#param.contents.has-tag')</div>
    <a href="@lang('#param.contents.key-of-href')">@lang('#param.contents.link')</a
    ><img src="@lang('#param.contents.img-key-of-src')" /><img
      src="@lang('#param.contents.another-img-key-of-src')"
    />
  </div>
</div>
```

#### 提取得到的 JSON: parameter.trans.json

```json
[
  {
    "key": "#param.contents.plain",
    "value": "plain"
  },
  {
    "key": "#param.contents.has-tag",
    "value": "first line<br class=\"newline\" />second line"
  },
  {
    "key": "#param.contents.key-of-href",
    "value": "https://oppo.com"
  },
  {
    "key": "#param.contents.link",
    "value": "this is a link"
  },
  {
    "key": "#param.contents.img-key-of-src",
    "value": "images/home/kv/image_360-da7114c030c216408fb9cf35e6e50693.png"
  },
  {
    "key": "#param.contents.another-img-key-of-src",
    "value": "images/home/kv/image_360-da7114c030c216408fb9cf35e6e50693.png"
  }
]
```
