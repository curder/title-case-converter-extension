# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

Chrome / Firefox 浏览器扩展（Manifest V3），将当前聚焦输入框的文本转换为 Title Case。仅支持可编辑的 `INPUT`（`type=text|search`）与 `TEXTAREA`，排除只读、禁用及其它 input 类型。content script 不常驻，按需注入。源码使用 TypeScript，esbuild 打包为 classic script；单元测试使用 Vitest + jsdom。无 lint 配置，验证方式为 `pnpm run verify` + 构建后手动加载扩展。

贡献流程（Issue → 分支 → PR → CI → Squash 合并 → 发布）与 Agent 约定见 `AGENTS.md`。

## 常用命令

```bash
pnpm install                 # 安装依赖（版本由 package.json 的 packageManager 字段固定）
pnpm run verify              # lint + 格式检查 + typecheck + 覆盖率测试
pnpm run lint                # oxlint（--deny-warnings）
pnpm run format              # prettier --write
pnpm run format:check        # prettier --check
pnpm run typecheck           # tsc --noEmit
pnpm run test                # vitest run
pnpm run test:coverage       # vitest run --coverage（阈值见 vitest.config.ts）
pnpm run test:watch          # vitest watch
pnpm run test:e2e            # 构建 Chrome 产物后用 Playwright 跑 e2e（仅 Chromium）
pnpm run build               # 清理 dist 并构建 Chrome + Firefox
pnpm run build:chrome        # 仅 Chrome
pnpm run build:firefox       # 仅 Firefox
pnpm run clean               # rimraf dist
pnpm run build:assets        # 编译 TS 入口，并把静态文件与 icons 复制到 dist/{chrome,firefox}
pnpm run publish:firefox     # web-ext 签名并上传 AMO，需要 AMO_JWT_ISSUER / AMO_JWT_SECRET
```

依赖管理使用 pnpm，`pnpm-lock.yaml` 是唯一锁文件；CI 用 `pnpm install --frozen-lockfile`。`package.json` 的 `engines.node` 要求 Node >= 24。项目根目录的 `pnpm-workspace.yaml` 不承载 workspace，仅存放 pnpm 设置：`allowBuilds` 允许 `esbuild` 执行 postinstall 安装平台二进制（pnpm 默认拒绝依赖安装脚本）。

Lint / 格式：`oxlint`（配置在 `.oxlintrc.json`）负责 lint，`prettier`（配置在 `.prettierrc.json`）负责格式；`typescript-eslint` 目前不支持项目使用的 TypeScript 7，暂不引入。

本地验证：在 `chrome://extensions` 开启开发者模式后加载 `dist/chrome`；Firefox 通过 `about:debugging#/runtime/this-firefox` 临时载入 `dist/firefox/manifest.json`（也可用 `npx web-ext run --source-dir dist/firefox`）。

e2e：`pnpm run test:e2e` 先构建 `dist/chrome`，再由 `scripts/prepare-e2e.js` 复制为 `dist/chrome-e2e` 并附加 `http://127.0.0.1/*` 的 `host_permissions`。Playwright 无法触发扩展快捷键或工具栏点击，拿不到 `activeTab` 授权，因此测试产物需要这一测试专用权限；生产产物不包含它。用例通过 service worker 的 `chrome.tabs.sendMessage` 触发转换（失败时先注入 `content.js`），无法覆盖工具栏点击与 Alt+Shift+T 快捷键。Playwright 的 Firefox 不支持加载扩展，Firefox 仍为手动冒烟。

发布：改 `package.json` 的 `version` → 提交 → 打 `vX.Y.Z` tag 并推送，`.github/workflows/release.yml` 会自动构建、发布 Firefox、创建 GitHub Release 并上传 `.zip` / `.xpi`。

## 架构

### 运行时数据流

1. `src/background.ts` 监听 `action.onClicked` 和 `commands` 中的 `_execute_action`（Alt+Shift+T / Mac Command+T）。
2. 触发后先向活动标签页发送消息 `{ action: "convertToTitleCase" }`；若发送失败（首次触发、页面刷新或安装前已打开的页面），通过 `scripting.executeScript` 注入 `content.js` 后重试一次。Chrome 的 polyfill 未暴露 `scripting`，回退到原生 `chrome.scripting`；Firefox 使用 `browser.scripting`。`activeTab` 在点击图标或快捷键时由浏览器授予，因此无需 `<all_urls>` 常驻脚本。
3. `src/content.ts` 接收消息，调用 `convertActiveElement(document.activeElement)`：`src/lib/text-control.ts` 只接受可编辑的 `input[type=text|search]` 与 `textarea`；`src/lib/toggle.ts` 负责首次转换并在 `WeakMap` 中记录原文快照，若当前值仍等于上次转换结果则还原原文；`src/lib/native-value.ts` 通过原生 value setter 赋值（避免绕过 React 的 value tracker），`src/convert-active-element.ts` 仅在值真正变化时派发 `input` 冒泡事件以同步受控组件状态。
4. 转换逻辑全部在 `src/lib/title-case.ts`：按 `[.!?]\s+` 分句，每句首词大写，`LOWERCASE_WORDS` 中的词保持小写。

`background.ts` 通过 `typeof browser !== 'undefined' ? browser : chrome` 兼容两侧 API；仅声明了项目实际用到的 WebExtension 接口（`src/types/webextension.d.ts`），未引入完整 `@types/chrome`。Chrome 下 `src/service-worker.js` 先 `importScripts` polyfill 再加载打包后的 `background.js`；Firefox 下 `background.js` 作为 MV3 事件页直接运行，不加载 polyfill。

### 构建流水线

`scripts/build-assets.js` → `scripts/build.js <chrome|firefox>`：

- `build-assets.js` 先清空目标目录，再用 esbuild 把 `src/content.ts`、`src/background.ts` 打包成 IIFE（minify、跳过 `.DS_Store` 等隐藏文件）写入 `dist/chrome` 与 `dist/firefox`（content script 与 background 不能是 ES module）。Chrome 额外复制 `src/service-worker.js`、从 `node_modules/webextension-polyfill` 复制 `browser-polyfill.js` 以及 `icons/`；Firefox 只复制 `icons/`。
- `build.js` 以 `src/manifest.json` 为基底，**浅合并** `src/manifest.chrome.json` 或 `src/manifest.firefox.json`，再用 `package.json` 的 `version` 覆盖（name / description 保持 manifest 中的值），写入 `dist/<browser>/manifest.json`，最后用 archiver 打包成 `dist/chrome-v<version>.zip` 或 `dist/firefox-v<version>.xpi`。

关键点：

- `package.json.version` 是版本唯一来源；`src/manifest.json` 与浏览器专属 manifest 不声明 `version`，构建时统一写入。
- 合并是浅合并：浏览器专属 manifest 中的数组/对象会**整体替换**基础 manifest 的同名项，不会递归合并。例如 Firefox 的 `permissions` 会整体替换基础值。
- 修改 `manifest` 引用的文件名时，必须同步 `scripts/build-assets.js` 的静态复制列表（Chrome 的 `service-worker.js`、`browser-polyfill.js`）、esbuild 入口（`content.ts`、`background.ts`）以及 `src/background.ts` 中注入的 `content.js` 文件名。`browser-polyfill.js` 来自 `webextension-polyfill` 依赖，不再 vendored。
- 平台后台差异：Chrome 由 `src/manifest.chrome.json` 声明 `background.service_worker`；Firefox 由 `src/manifest.firefox.json` 声明 `background.scripts: ["background.js"]`（Firefox 的 MV3 不支持 service worker 后台），权限为 `activeTab` + `scripting`，content script 不加载 polyfill（Firefox 原生已有 `browser` 命名空间，polyfill 会在 Firefox 中抛错）。两个平台都不声明 `content_scripts`，脚本由背景脚本按需注入。
- `dist/` 在 `.gitignore` 中，仓库里现存的 `dist/` 是本地产物，可能已过期。

### 发布

`scripts/publish-firefox.js` 用 `web-ext` 的 `sign` 以 `unlisted` 渠道上传 `dist/firefox`，再把 AMO 返回的签名 xpi 复制为 `dist/firefox-v<version>.xpi`，确保 GitHub Release 附件是签名版；凭据只来自环境变量，CI 中由 secrets 注入。

## 代码约定

- 源代码、注释使用简体中文。
- 提交信息使用简体中文，前缀遵循 Conventional Commits（`feat` / `fix` / `refactor` / `docs` / `test` / `chore` / `perf` / `style` / `build` / `ci` / `revert`），scope 与 subject 只写一行，不加正文，例如 `fix(content): 第二次触发时还原原文`。
- 唯一例外是协作者标注：改动由 Claude Code 参与编写时，在 subject 后空一行加一行 `Co-Authored-By: Claude Code <noreply@anthropic.com>`，供 GitHub 做协作者归属；除此之外不加任何 trailer 或正文。
- `src/content.ts` 中的 `chrome.runtime.onMessage` 监听器仅在处理转换消息时返回 `true` 并 `sendResponse`；其它消息返回 `false`，避免消息通道悬挂。
- 新增输入元素类型或转换规则时，改 `src/lib/` 下的对应模块与 `src/convert-active-element.ts`，并补充 `tests/` 用例；背景脚本不承载业务逻辑。
- 测试位于 `tests/`，运行在 jsdom 下；纯逻辑放在 `src/lib/` 以便直接导入，不依赖浏览器扩展环境。
