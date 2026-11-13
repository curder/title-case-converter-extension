import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// 原样复制到产物中的运行时文件，TS 入口由 esbuild 另外编译
const staticFiles = ['browser-polyfill.js', 'service-worker.js'];
const allTargets = ['chrome', 'firefox'];

// 跳过 .DS_Store 等隐藏文件，避免 macOS 元数据混入构建产物
function isVisibleFile(source) {
  return !path.basename(source).startsWith('.');
}

async function copyStaticAssets(targetDir) {
  await fs.ensureDir(targetDir);

  for (const file of staticFiles) {
    const srcFile = path.join(rootDir, 'src', file);
    if (await fs.pathExists(srcFile)) {
      await fs.copy(srcFile, path.join(targetDir, file));
    }
  }

  const iconsDir = path.join(rootDir, 'icons');
  if (await fs.pathExists(iconsDir)) {
    await fs.copy(iconsDir, path.join(targetDir, 'icons'), { filter: isVisibleFile });
  }
}

async function compileEntrypoints(targetDir) {
  await build({
    entryPoints: [
      path.join(rootDir, 'src/content.ts'),
      path.join(rootDir, 'src/background.ts'),
    ],
    outdir: targetDir,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome109', 'firefox109'],
    charset: 'utf8',
    legalComments: 'none',
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
    await copyStaticAssets(targetDir);
    await compileEntrypoints(targetDir);
  }
}

buildTargets().catch((error) => {
  console.error(error);
  process.exit(1);
});
