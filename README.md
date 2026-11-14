# Title Case Converter Browser Extension

一个简单的浏览器扩展，支持 Chrome 和 Firefox，用于将输入框中的文本转换为标题格式（Title Case）。

## 开发设置

项目使用 pnpm 管理依赖，所需版本见 `package.json` 的 `packageManager` 字段（`corepack enable` 或直接安装对应版本即可）。

1. 安装依赖：

```bash
pnpm install
```

2. 类型检查与测试：

```bash
## 类型检查 + 单元测试
pnpm run verify

## 仅类型检查
pnpm run typecheck

## 仅单元测试
pnpm run test
```

3. 构建扩展：

```bash
## 构建所有版本
pnpm run build

## 构建 Chrome 版本
pnpm run build:chrome

## 构建 Firefox 版本
pnpm run build:firefox
```

## 发布流程

1. 更新版本号：
   - 修改 `package.json` 中的 `version` 字段
   - 提交并推送更改：
     ```bash
     git add package.json
     git commit -m "chore: 升级版本到 v1.0.0"
     git push
     ```

2. 创建发布：
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

3. GitHub Actions 将自动：
   - 构建扩展
   - 创建 Release
   - 上传构建文件

## 功能特点

- 自动将选中输入框中的文本转换为标题格式
- 再次触发可将输入框还原为转换前的原文（toggle）
- 支持所有网页的文本输入框和文本区域
- 可以通过工具栏图标或自定义快捷键触发
- 智能处理常见的小写单词（如 a, an, the 等）
- 正确处理句子边界和标点符号

## 安装方法

### Chrome
1. 下载或克隆此仓库
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择构建后的 `dist/chrome` 目录（先执行 `pnpm run build:chrome`）

### Firefox
1. 下载或克隆此仓库
2. 打开 Firefox 浏览器，访问 `about:debugging#/runtime/this-firefox`
3. 点击"临时载入附加组件"
4. 选择构建后的 `dist/firefox/manifest.json` 文件（先执行 `pnpm run build:firefox`）

## 使用方法

1. 点击输入框，使其获得焦点
2. 点击浏览器工具栏中的扩展图标或使用设置的快捷键，文本会转换为标题格式
3. 再次点击图标或使用快捷键，会还原为转换前的原文；若转换后手动修改过文本，则视为新的原文重新转换

## 快捷键设置

### 默认快捷键
- Windows/Linux: `Alt+Shift+T`
- Mac: `Option+Shift+T`

### 自定义快捷键
如果默认快捷键与其他程序冲突，您可以自定义：

1. Chrome 浏览器
   - 访问 `chrome://extensions/shortcuts`
   - 找到 "Title Case Converter"
   - 点击输入框设置新的快捷键

2. Firefox 浏览器
   - 访问 `about:addons`
   - 点击齿轮图标，选择"管理扩展快捷键"
   - 找到 "Title Case Converter" 并设置新的快捷键

## 标题格式规则

- 句子的第一个单词首字母大写
- 主要单词首字母大写
- 以下单词保持小写（除非在句首）：
  - 冠词：a, an, the
  - 连词：and, but, or, for, nor
  - 介词：on, at, to, from, by, in, of, with

## 技术实现

- 使用 Manifest V3 规范开发
- 源码使用 TypeScript，esbuild 打包为浏览器可直接加载的 classic script
- 单元测试使用 Vitest + jsdom，覆盖转换规则、toggle 还原与后台重试逻辑
- 核心组件：
  - Background Script (Service Worker)：处理扩展图标点击和快捷键事件
  - Content Script：实现文本转换逻辑和DOM操作
- 跨浏览器兼容：使用 browser-polyfill.js 实现 Chrome 和 Firefox 的 API 统一
- 事件处理：
  - 实现输入框焦点检测
  - 自动触发 input 事件确保与其他脚本兼容
  - 完善的错误处理和状态反馈机制

## 注意事项

- 仅支持可编辑的文本输入框（`type=text` / `search`）和文本区域，复选框、数字、文件等类型不会被修改
- 需要页面具有输入焦点才能进行转换
- 转换后会自动触发输入事件，确保与其他脚本兼容；文本已是标题格式时不会改动，也不会触发输入事件

## 许可证

[MIT License](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request！