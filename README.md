# 产品站项目架构文档（OPPO + OnePlus）

## vender 选择

删除`vender/`下不需要的文件夹即可，例如开发 OPPO 产品站时删除 oneplus/ 保留 oppo/。

## .env.yaml

项目中配置了`wk-j.save-and-run`插件，在安装了该插件后，保存`.env.yaml`文件后会自动生
成`TypeScript`和`Eslint`的全局常量声明。也可以通过下面命令手动生成（以 pages/oppo/.env.yaml 为例）：
```bash
yarn declare:envs --page oppo
```

## 开发

参照语雀文档：https://www.yuque.com/czubav/cgr0kd
