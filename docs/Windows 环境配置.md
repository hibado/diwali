# Windows 环境配置

> node.js >= 10

### 0. 使用**管理员身份**(run as Administrator)打开 PowerShell 或者 cmd.exe

## 1. npm/yarn 代理设置(非必需)

> 设置代理后可以加快安装过程，未设置代理甚至可能因为网络问题安装失败

使用 yarn 时:
```
yarn config set proxy http://xxx
yarn config set https-proxy http://xxx
```
使用 npm 时:
```
npm config set proxy http://xxx
npm config set https-proxy http://xxx
```

## 2. 安装 windows build tools
使用 yarn 时:
```
yarn global add --production windows-build-tools
```
使用 npm 时:
```
npm install --global --production windows-build-tools
```

## 3. 成功安装 windows build tools 后，退出管理员身份登录的 PowerShell 或 cmd.exe
