import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// 原样复制到产物中的运行时文件；service-worker.js 仅 Chrome 使用
const staticFilesByTarget = {
  chrome: ['service-worker.js'],
  firefox: [],
};
const allTargets = Object.keys(staticFilesByTarget);

// Chrome 的 background 需要通过它拿到 browser 命名空间；Firefox 原生提供，无需复制
const polyfillSource = path.join(rootDir, 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js');

// 跳过 .DS_Store 等隐藏文件，避免 macOS 元数据混入构建产物
function isVisibleFile(source) {
  return !path.basename(source).startsWith('.');
}

async function copyStaticAssets(targetDir, target) {
  // 先清空目标目录，避免重命名入口后旧文件残留进压缩包
  await fs.emptyDir(targetDir);

  for (const file of staticFilesByTarget[target]) {
    await fs.copy(path.join(rootDir, 'src', file), path.join(targetDir, file));
  }

  if (target === 'chrome') {
    await fs.copy(polyfillSource, path.join(targetDir, 'browser-polyfill.js'));
  }

  const iconsDir = path.join(rootDir, 'icons');
  if (await fs.pathExists(iconsDir)) {
    await fs.copy(iconsDir, path.join(targetDir, 'icons'), { filter: isVisibleFile });
  }
}

async function compileEntrypoints(targetDir) {
  await build({
    entryPoints: [path.join(rootDir, 'src/content.ts'), path.join(rootDir, 'src/background.ts')],
    outdir: targetDir,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome109', 'firefox109'],
    charset: 'utf8',
    legalComments: 'none',
    minify: true,
  });
}

async function buildTargets() {
  const requested = process.argv[2];
  const targets = requested ? [requested] : allTargets;

  for (const target of targets) {
    if (!allTargets.includes(target)) {
      throw new Error(`未知的构建目标: ${target}，可选值: ${allTargets.join(' / ')}`);
    }

    const targetDir = path.join(distDir, target);
    await copyStaticAssets(targetDir, target);
    await compileEntrypoints(targetDir);
  }
}

buildTargets().catch((error) => {
  console.error(error);
  process.exit(1);
});
