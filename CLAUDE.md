# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

Chrome / Firefox 浏览器扩展（Manifest V3），将当前聚焦输入框的文本转换为 Title Case。仅支持 `INPUT` 与 `TEXTAREA`。无测试框架、无 lint 配置；验证方式是构建后手动加载扩展。

## 常用命令

```bash
npm install                 # 安装依赖
npm run build               # 清理 dist 并构建 Chrome + Firefox
npm run build:chrome        # 仅 Chrome（内部先执行 copy:common）
npm run build:firefox       # 仅 Firefox（内部先执行 copy:common）
npm run clean               # rimraf dist
npm run copy:common         # 仅把 src 通用文件与 icons 复制到 dist/{chrome,firefox}
npm run publish:firefox     # web-ext 签名并上传 AMO，需要 AMO_JWT_ISSUER / AMO_JWT_SECRET
```

本地验证：在 `chrome://extensions` 开启开发者模式后加载 `dist/chrome`；Firefox 通过 `about:debugging#/runtime/this-firefox` 临时载入 `dist/firefox/manifest.json`（也可用 `npx web-ext run --source-dir dist/firefox`）。

发布：改 `package.json` 的 `version` → 提交 → 打 `vX.Y.Z` tag 并推送，`.github/workflows/release.yml` 会自动构建、发布 Firefox、创建 GitHub Release 并上传 `.zip` / `.xpi`。

## 架构

### 运行时数据流

1. `src/background.js` 监听 `action.onClicked` 和 `commands` 中的 `_execute_action`（Alt+Shift+T / Mac Command+T）。
2. 触发后向活动标签页注入 `content.js`（仅 Chrome 走 `chrome.scripting.executeScript`，注入失败视为已存在），再发送消息 `{ action: "convertToTitleCase" }`。
3. `src/content.js` 接收消息，取 `document.activeElement`，用 `convertToTitleCase()` 改写 `value`，随后派发 `input` 冒泡事件以兼容框架的受控输入。
4. 转换逻辑全部在 `content.js`：按 `[.!?]\s+` 分句，每句首词大写，`lowercaseWords` 列表中的词保持小写。

`background.js` 通过 `typeof browser !== 'undefined' ? browser : chrome` 兼容两侧 API；Chrome 下 `src/service-worker.js` 先 `importScripts` polyfill 再加载 `background.js`。

### 构建流水线

`scripts/copy-common.js` → `scripts/build.js <chrome|firefox>`：

- `copy-common.js` 把 `content.js`、`background.js`、`browser-polyfill.js` 和 `icons/` 复制到 `dist/chrome` 与 `dist/firefox`。
- `build.js` 以 `src/manifest.json` 为基底，**浅合并** `src/manifest.chrome.json` 或 `src/manifest.firefox.json`，再用 `package.json` 的 `name` / `description` / `version` 覆盖，写入 `dist/<browser>/manifest.json`，最后用 archiver 打包成 `dist/chrome-v<version>.zip` 或 `dist/firefox-v<version>.xpi`。

关键点：

- `package.json.version` 是版本唯一来源；`src/manifest.json`、`src/manifest.firefox.json` 里的 `version` 字段在构建时会被覆盖，不要在那里改版本。
- 合并是浅合并：浏览器专属 manifest 中的数组/对象会**整体替换**基础 manifest 的同名项，不会递归合并。例如 Firefox 的 `permissions` 和 `content_scripts` 会覆盖基础值。
- 修改 `manifest` 引用的文件名时，必须同步 `scripts/copy-common.js` 的复制列表。当前 `src/manifest.chrome.json` 的 `background.service_worker` 指向 `service-worker.js`，但该文件尚未加入复制列表；`src/manifest.firefox.json` 仍残留 MV2 的 `browser_action` / `popup.html` 配置，改动该文件时注意清理。
- `dist/` 在 `.gitignore` 中，仓库里现存的 `dist/` 是本地产物，可能已过期。

### 发布

`scripts/publish-firefox.js` 用 `web-ext` 的 `sign` 以 `unlisted` 渠道上传 `dist/firefox`，输出 `.xpi` 到 `dist/`；凭据只来自环境变量，CI 中由 secrets 注入。

## 代码约定

- 源代码、注释、提交信息使用简体中文；提交信息遵循 Conventional Commits 且仅一行。
- `content.js` 中的 `chrome.runtime.onMessage` 监听器返回 `true` 以保持消息通道开放，并始终 `sendResponse`，不要改成异步而不处理通道。
- 新增输入元素类型或转换规则时，只需改 `content.js`；背景脚本不承载业务逻辑。
