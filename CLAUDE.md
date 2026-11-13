# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

Chrome / Firefox 浏览器扩展（Manifest V3），将当前聚焦输入框的文本转换为 Title Case。仅支持 `INPUT` 与 `TEXTAREA`。无测试框架、无 lint 配置；验证方式是构建后手动加载扩展。

贡献流程（Issue → 分支 → PR → CI → Squash 合并 → 发布）与 Agent 约定见 `AGENTS.md`。

## 常用命令

```bash
pnpm install                 # 安装依赖（版本由 package.json 的 packageManager 字段固定）
pnpm run build               # 清理 dist 并构建 Chrome + Firefox
pnpm run build:chrome        # 仅 Chrome（内部先执行 copy:common）
pnpm run build:firefox       # 仅 Firefox（内部先执行 copy:common）
pnpm run clean               # rimraf dist
pnpm run copy:common         # 仅把 src 通用文件与 icons 复制到 dist/{chrome,firefox}
pnpm run publish:firefox     # web-ext 签名并上传 AMO，需要 AMO_JWT_ISSUER / AMO_JWT_SECRET
```

依赖管理使用 pnpm，`pnpm-lock.yaml` 是唯一锁文件；CI 用 `pnpm install --frozen-lockfile`。项目根目录的 `pnpm-workspace.yaml` 不承载 workspace，仅存放 pnpm 设置：`allowBuilds` 显式拒绝 `web-ext` 传递依赖（`core-js`、`dtrace-provider`、`spawn-sync`）的安装脚本，这些脚本 npm 时期同样未执行，构建与发布都不依赖它们。

本地验证：在 `chrome://extensions` 开启开发者模式后加载 `dist/chrome`；Firefox 通过 `about:debugging#/runtime/this-firefox` 临时载入 `dist/firefox/manifest.json`（也可用 `npx web-ext run --source-dir dist/firefox`）。

发布：改 `package.json` 的 `version` → 提交 → 打 `vX.Y.Z` tag 并推送，`.github/workflows/release.yml` 会自动构建、发布 Firefox、创建 GitHub Release 并上传 `.zip` / `.xpi`。

## 架构

### 运行时数据流

1. `src/background.js` 监听 `action.onClicked` 和 `commands` 中的 `_execute_action`（Alt+Shift+T / Mac Command+T）。
2. 触发后先向活动标签页发送消息 `{ action: "convertToTitleCase" }`；若发送失败（content script 未注入，如安装前已打开的页面），Chrome 通过 `chrome.scripting.executeScript` 注入 `content.js` 后重试一次，Firefox 无 `scripting` 权限则直接报错。
3. `src/content.js` 接收消息，取 `document.activeElement`，用 `toggleTitleCase()` 计算结果：第一次转换并在 `WeakMap` 中记录原文快照，若当前值仍等于上次转换结果则还原原文；再通过原生 value setter 赋值（避免绕过 React 的 value tracker）并派发 `input` 冒泡事件以同步受控组件状态。
4. 转换逻辑全部在 `content.js`：按 `[.!?]\s+` 分句，每句首词大写，`lowercaseWords` 列表中的词保持小写。

`background.js` 通过 `typeof browser !== 'undefined' ? browser : chrome` 兼容两侧 API。Chrome 下 `src/service-worker.js` 先 `importScripts` polyfill 再加载 `background.js`；Firefox 下 `background.js` 作为 MV3 事件页直接运行，不加载 polyfill。

### 构建流水线

`scripts/copy-common.js` → `scripts/build.js <chrome|firefox>`：

- `copy-common.js` 把 `content.js`、`background.js`、`browser-polyfill.js` 和 `icons/` 复制到 `dist/chrome` 与 `dist/firefox`。
- `build.js` 以 `src/manifest.json` 为基底，**浅合并** `src/manifest.chrome.json` 或 `src/manifest.firefox.json`，再用 `package.json` 的 `name` / `description` / `version` 覆盖，写入 `dist/<browser>/manifest.json`，最后用 archiver 打包成 `dist/chrome-v<version>.zip` 或 `dist/firefox-v<version>.xpi`。

关键点：

- `package.json.version` 是版本唯一来源；`src/manifest.json`、`src/manifest.firefox.json` 里的 `version` 字段在构建时会被覆盖，不要在那里改版本。
- 合并是浅合并：浏览器专属 manifest 中的数组/对象会**整体替换**基础 manifest 的同名项，不会递归合并。例如 Firefox 的 `permissions` 和 `content_scripts` 会覆盖基础值。
- 修改 `manifest` 引用的文件名时，必须同步 `scripts/copy-common.js` 的复制列表（`content.js`、`background.js`、`service-worker.js`、`browser-polyfill.js`）。
- 平台后台差异：Chrome 由 `src/manifest.chrome.json` 声明 `background.service_worker`；Firefox 由 `src/manifest.firefox.json` 声明 `background.scripts: ["background.js"]`（Firefox 的 MV3 不支持 service worker 后台），且只保留 `activeTab` 权限、content script 不加载 polyfill（Firefox 原生已有 `browser` 命名空间，polyfill 会在 Firefox 中抛错）。
- `dist/` 在 `.gitignore` 中，仓库里现存的 `dist/` 是本地产物，可能已过期。

### 发布

`scripts/publish-firefox.js` 用 `web-ext` 的 `sign` 以 `unlisted` 渠道上传 `dist/firefox`，再把 AMO 返回的签名 xpi 复制为 `dist/firefox-v<version>.xpi`，确保 GitHub Release 附件是签名版；凭据只来自环境变量，CI 中由 secrets 注入。

## 代码约定

- 源代码、注释使用简体中文。
- 提交信息使用英文，遵循 Conventional Commits，且只写一行（本项目规则覆盖全局 CLAUDE.md 中的中文提交约定）。
- `content.js` 中的 `chrome.runtime.onMessage` 监听器返回 `true` 以保持消息通道开放，并始终 `sendResponse`，不要改成异步而不处理通道。
- 新增输入元素类型或转换规则时，只需改 `content.js`；背景脚本不承载业务逻辑。
