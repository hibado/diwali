# 关于产品站架构的~~一切~~XX


语雀：https://zhinantech.yuque.com/czubav/cgr0kd/udwdt8



## 虚假的 Q&A

### Q：我们使用什么构建工具？相关的配置文件在哪？

我们使用 `webpack@4` 来构建项目，配置的信息主要在 build/webpack.config.js 文件入中。另外有：

- build/webpack.dev.js：在 webpack.config.js 的基础上加了 devServer，并在开发设备内存较小（小于 16GiB）时将生成的文件写到硬盘中而不是留在内存中
- webpack.config.js：仅供 eslint-import-resolver-webpack 使用的配置，仅提供 resolve.alias 配置
- build/font-spider/webpack.font.babel.js：使用 font-spider 压缩字体时使用的配置——功能不是很完善，在使用不同的字体文件时需要修改其中的定义



### Q：yarn dev、yarn build、yarn build:prod、yarn build:patch 这些指令有什么区别？

首先 dev 相对于 build 指令主要是添加了 devServer 的配置，另外在部分 loader 和 plugin 上也有区别，可以在项目中全局搜索 `__DEV__` 来查看影响到的内容。

`build:prod `是用来构建交付给 OPPO 代码包的指令，相对于 build 指令构建出的代码包的主要区别在 HTML 中（更加详细的区别可以通过全局搜索 `__AEM__` 查看）：

- build 指令会以 vender/ 下的 html 文件为模板，将 page 中的 index.pug 输出的 HTML 内容嵌入，并把生成的 css 和 js 文件通过 `<style>` 和 `<script>` 标签引入
- build:prod 指令构建的 html 文件只包含 index.pug 输出的内容，且不会引入 css 和 js 文件，html、css、js 文件独立交付给 OPPO 方，由他们处理

build:patch 是在 build:prod 的基础上完成的，用于构建增量包。具体可查看 `build/plugins/PatchBuildPlugin.js`。



### Q：`data-src-xxx `这类属性引用的资源是如何处理的？

这些属性是在 `html-loader` 中配置和处理的。我们在 webpack 配置中 html-loader 的 `options.attributes.list` 里定义了这些属性。html-loader 在 build 过程中遇到指定的属性就会按照规则解析出里面的资源路径，然后通过 webpack 的`require`将资源打包到项目中。

```javascript
{
  loader: 'html-loader',
  options: {
    esModule: true,
    minimize: false,
    preprocessor: createProcessor(imagePre), // 这个 processor 会在 html-load 处理内容之前执行
    attributes: {
      list: [
        { tag: 'video', attribute: 'poster', type: 'src' },
        { attribute: 'src', type: 'src' },
        { attribute: 'srcset', type: 'srcset' },
        { attribute: 'data-src', type: 'src' },
        // ...
      ],
    },
  },
}
```



### Q：`image-loader` 做了什么？

image-loader 能够根据资源路径后带的参数对图片按比例缩小图片并输出原格式图片和`WebP`格式两种图片。例如：

```html
<img data-src="/path/to/img.jpg?{ratio:0.5}" data-srcset="/path/to/img.jpg?{ratios:[1,0.5]}">
```

在 build 后会成为：

```html
<img data-src="/public/path/to/img-[hash1].jpg.webp" data-srcset="/public/path/to/img-[hash2].jpg.webp 100w, /public/path/to/img-[hash2].jpg.webp 50w">
```



### Q：`@src` 和 `@src-p` 是如何工作的？

这些属性（还包括 `@poster`、`@bg`）都是配合多尺寸适配的属性缩写。在 html-loader 的 preprocessor 中将这些属性**根据配置**展开成多个带不同 `ratio(s)` 参数的 `data-src-xxx` 属性。例如：

```html
<img @src-p="/path/to/img.jpg">
```

会被处理成

```html
<img data-src-360="/path/to/img.jpg?{ratio:0.5}" data-src-768="/path/to/img.jpg?{ratio:1}">
```



### Q：只有 `@src` 或 `@src-p` 中的图片会被压缩吗？

不是的。image-loader 会对图片进行压缩，而是否使用 image-loader 取决于 webpack 配置中的 module.rules。目前项目中的 jpeg、png、svg 三种格式的图片默认都会被 image-loader 处理。

同时需要注意，image-loader 在处理 svg 时会忽略 ratio(s) 属性，所以给 svg 图片不同的 ratio 并没有意义——通过 `@src` 引入 svg 图片是没有意义的，应直接使用 `data-src`。

```javascript
{
  test: /.(jpe?g|png|svg)$/i,
  loader:
    mode === 'development' && useRawImages
      ? [
          {
            loader: 'file-loader',
            options: { name: '[path][name]-[md5:contenthash:hex:6].[ext]' },
          },
        ]
      : [{ loader: 'image-loader', options: imageLoaderOptions }],
}
```



### Q：有张图我不想压缩怎么办？

可以在资源路径后带上 `?no-minify ` 或 `?raw-image ` 参数（注意此时就不要使用  `@src`  之类的属性了，因为没有意义），如：

```html
<img data-src="path/to/img.jpg?no-minify" />
```

是通过 module.rules 的这个规则实现的：

```javascript
{
  test: /.(jpe?g|png|svg)$/i,
  resourceQuery: /no-?minify|raw-?image/i,
  loader: 'file-loader',
  options: {
    esModule: true,
    name: imageLoaderOptions.name,
    context: imageLoaderOptions.context,
  },
}
```





### Q：为什么没有继续使用 `<img srcset>`？

srcset 需要配合 sizes 使用，需要开发关注图片实际尺寸和显示时的尺寸的关系，使用时经常出问题。另外是在之前使用的过程中，Chrome 表现与 Safari 和 Firefox 不太一样——Chrome 可能会选中 srcset 中的清晰度不够的图片。后来 image-loader 和 lazyload 的更新中都可能没有再考虑 srcset 的使用场景，故使用 srcset 可能会出问题，需要做相应的修改。



### Q：为什么项目中的 webpack 配置和 scripts 等可以使用 esmodule 语法？

是通过 `@babel/register `处理的，详细可查看 `package.json` 中的 `scripts.babel` 指令。



### Q：为什么这张图片这么模糊？

图片模糊的原因通常有好几种，建议依次排查：

1. 在使用 `@src` 或 `@src-p` 引入图片时，导出的图片尺寸是否符合要求？——PC 为 1920 下实际显示的 2x，MO 为 360 下实际显示的 4x

2. 设计稿中待导出的图片原尺寸是否满足要求？例如设计稿中某张图原尺寸为 100x100，显示尺寸为 50x50，导出 4x 图时为 200x200——实际上做了无意义的放大无法满足 4x 的要求，在没有更清晰的素材时可以使用 data-src-xxx 配合 ratio 参数手动适配不同尺寸以满足清晰度要求

3. 原素材/导出的图片是否已经被压缩过导致模糊？

4. image-loader 压缩图片质量损失太大？这种情况通常在原素材色彩比较丰富或是有渐变色或渐变透明度的情况。此时可以通过 image-laoder 的 quality 参数提高输出图片的质量。目前 quality 的默认值为 75，可以适当增加该值，如果在 quality 设置到最大（100）时也还是模糊，可以尝试添加 `lossless:true`

   ```html
   <img data-src="/path/to/img.png?{quality:90,lossless:true}"
   ```



### Q：为什么这张图这么大？

有时一张看上去大片透明的图片实际上包含肉眼难以察觉的半透明渐变——例如手机边框图层，此时在满足显示效果的前提下可以尝试将其中半透明部分抠除。



### Q：具体项目里如何指定使用 OPPO 或 OnePlus 的模板？

删除 vender/ 下多余的文件夹即可。当 vender/ 下存在 oppo/ 文件夹时会使用 OPPO 的模板，当不存在 oppo/ 文件夹且存在 oneplus/ 文件夹时会使用 OnePlus 模板。



### Q：OPPO 和 OnePlus 项目有哪些不同？

主要的不同包括 html 模板、css 样式覆盖、字体定义和使用以及海外多语言处理等。具体可以通过全局搜索 `__OPPO__` 和 `__ONEPLUS__` 查看。



### Q：同一个页面的较小差异版本应该如何定义和使用？

首先需要在某个 pages/xxx/.env.yaml 中定义指定的 target，开发时通过常量 `__TGT_[target]` 来判断是否是在构建某个具体版本。具体可以查看 template 仓库中的 src/pages/oppo/.env.yaml 文件。



### Q：不同版本构建出的 assets 文件夹可以合并吗？

可以的。有两种情况：

- 在同一个仓库中通过 .env.yaml 定义不同版本时，由于资源文件本身放在一起所以不会有重名的问题（重名就确实是同一个文件），直接合并没有问题
- 不同版本在不同的仓库中，这种情况下资源是有可能存在重名但是不同文件的问题，不过由于构建出的资源文件带 hash，理论上出现合并后文件被覆盖的可能性也较小
  - 各版本差异较大但又有共用内容的情况下，可能在同一个仓库中建不同的 page 会更加合适



### Q：应该用哪种方式引入 stylus 文件？

建议只有共用的 stylus 文件在 page 下的 index.styl 中通过 `@import` 引入（例如 common/styles/index.styl），components 和 sections 中的 stylus 文件在相应的 js 中通过 `import` 引入。这么做有如下好处：

- 在引入某个 component 或 section 时不需要在 js 中 import 一遍又在 stylus 中 `@import` 一遍——容易遗漏
- 在用 Chrome dev 时更容易查看构建出来的 css 代码——当单个 `<style>` 中的内容过长时，Chrome 会将其隐藏，而每个在 js 中 import 的 css 会单独作为一个 `<style>` 添加

需要注意的是不要在不同的 js 中重复引入 stylus 文件——当调试时发现总是有重复的选择器加载元素上很可能就是因为这个。



### Q：如何添加自动引入的全局可用的 stylus 代码？

我们通过 style-resources-loader 为各个入口文件自动加上了想要自动引入的内容。可以通过如下方式在每个 stylus 入口文件上方加入指定内容：

- 所有 page 可用的内容可以加到 common/styles/auto/index.styl 中
- 特定 page 可用的内容可以加到 src/pages/auto.styl  中

需要注意，自动引入的内容不应该包含实际会生成 css 代码的内容——因为可能导致这部分内容重复多次，这种类型的内容可以放到 index.styl 中只被引入一次。



### Q：什么是一个 stylus 入口文件？

在 js 中 `import xxx.styl` 时，这个 styl 文件就是一个入口文件——webpack 会根据规则为其匹配到我们定义好的 loader。在 styl 文件中通过 `@import` 引入的文件并不是一个入口文件，因为这是在 stylus-loader 中被处理的。



### Q：那么想要在各个 stylus 文件中公用的内容是否应该定义在自动引入的文件中？

是的，只有这样才能避免在多个 stylus 入口文件中重复引入这些公用的内容——前提是这些内容不实际输出 css，对于会输出 css 的公用内容只用在一个 stylus 入口文件中引入即可。



### Q：stylus 中的 vh/vw 做了特殊处理吗？

stylus 中的 `[X]vh` 和 `[X]vw` 会被分别转换为 `calc(var(--vh, 1vh) * [X])`  和  `calc(var(--vw, 1vw) * [X])`。这是通过 PostCSS 插件做的，具体可以查看 postcss.config.js 这个文件。

其中 vh 的转换是为了解决，移动端视窗高度会随着划动方向频繁变化，导致以 vh 为单位的内容大小频繁变化的问题。而 vw 的转换是为了解决 PC 端滚动条存在时，100vw 会超出 body 的宽度，导致页面可横向滚动的问题。

实现原理是将不受我们控制的 vh/vw 单位转换成了可以受控制的 CSS 变量 --vh/--vw ——这些 CSS 变量在 js 中控制，其中 --vh 在移动端表现为只有视窗高度增加时 --vh 才会变化。

实际上写的时候也可以把 vh/vw 换成别的自定义单位，不过这么做（或许）会提高使用这套代码架构的成本——新接触的人需要了解更多的东西。

目前每个带 vh/vw 的属性定义都会被转换成两条，其中第一条是为了兼容不支持 CSS 变量的浏览器，理论上现在不需要了：

```css
// 转换前
.full {
  width: 100vw;
  height: 100vh;
}

// 转换后
.full {
  width: 100vw; // 在不支持 css var 的浏览器中，会生效
  width: calc(var(--vw, 1vw) * 100); // 在不支持 css var 的浏览器中，不会生效
  
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
}
```



### Q：rpx/mpx 是什么东西？

暂且可以认为是我们自定义的**长度单位**，会在已定义好的不同断点尺寸下转换为某一标准单位（如 px 或 vw）的不同值。该动能也是通过 PostCSS 插件实现的，具体可以查看 postcss.config.js 文件。目前 rpx 和 mpx 会按照下列方式工作：

- [N]`rpx`（OPPO 模板中）：首先会认定该值只在 PC 端生效，且 `[N]` 是 1920 尺寸下需要显示的长度，然后在不同的 `@media` 查询下进行缩放

  ```css
  // 转换前
  .container {
    width: 1920rpx;
  }
  
  // 转换后
  @media (min-width: 1800px) {
    .container {
  		width: 1920px;
    }
  }
  
  @media (min-width: 1400px and max-width: 1799px) {
    .container {
      width: 1440px; // 此处仅为实例，实际的值和配置中的 ratio 有关
    }
  }
  ```

- [N]`mpx`：首先会认定该值只在 MO 端生效，然后在以 `360mpx` 为 `100vw` 的转换比例将该值转换为 vw

  ```css
  // 转换前
  .container {
    width: 320mpx;
  }
  
  // 转换后
  @media (max-width: 1024px) {
    .container {
    	width: 88.889vw; // (320 / 360 * 100vw)
    }
  }
  ```

- [N]`rpx`（OnePlus 模板中）：首先会认定该值只在 MO 端生效，然后在以 `1920rpx` 为 `100vw` 的转换比例将该值转换为 vw

  ```css
  // 转换前
  .container {
    width: 1200rpx;
  }
  
  // 转换后
  @media (min-width: 1024px and max-width: 1799px) { // 仅示例，非实际值
    .container {
    	width: 62.5vw; // (1200 / 1920 * 100vw) 仅示例，非实际值
    }
  }
  ```

  

### Q：pages 中的页面是如何被发现的？

在 build/webpack.config.js 执行时，会先遍历 src/pages 下的目录，并找到其中包含 `index.(j|t)s` 或 `index.pug`/`template.pug` 的页面作为可选的页面。在选中页面后，会解析其中的 `.env.yaml` 文件判断是否需要选择构建版本目标。详细可以参看 `build/utils/select-page.js`。



### Q：在 pug 中是不是有什么隐藏的自定义功能我还不知道？

预定义了一些方法，示例如下：

- `classes()` 或 `parseClasses()`

  ```jade
  .parse-classes-example(class=parseClasses({ foo: true, bar: false }))
  .classes-example(class=classes({ foo: true, bar: false }))
  ```

  得到

  ```html
  <div class="parse-classes-example foo bar"></div>
  <div class="classes-example foo bar"></div>
  ```

- `pugInclude() ` 或 `PUG_INCLUDE()`

  ```jade
  // src/components/a.pug
  .a a
  
  // src/pages/b.pug
  .included!= PUG_INCLUDE('src/components/a.pug') // 路径总是相对于项目根目录的
  .b b
  ```

  得到

  ```html
  <div class=".included">
    <div class="a">a</div>
  </div>
  <div class="b">b</div>
  ```

  



## 史记

- 第一个产品站项目代号为“渡江”；
- 最早的项目开发模板是在 OPPO 提供的模板上修改得到的；
- 早期项目交付是交付整个项目源码的，由 OPPO 部署人员 build 后部署；
  - 由于 build 时环境不同，当时图片压缩在交付后出现过压缩后的图片不完整的问题，后通过将图片 build 缓存也一起打包解决了该问题。
- 早期 OPPO 项目中需要提取海外版本的多语言翻译信息，所以写了 TransWebpackPlugin 来通过 HTML 中的自定义属性提取相应的信息；
  - 目前 OPPO 项目中不再需要，仅在 OnePlus 项目中使用。
- 后来 OPPO 的部署系统做了升级：
  - 交付 build 后的代码；
  - 不再需要提取多语言翻译信息。
- 当时由于 AEM（——OPPO 用于部署的）系统在上传资源文件时不支持上传文件夹，所以满足了 OPPO 运营（Eric）的要求，在打包的时候将多层级的目录“降维”成一级；
- ...
