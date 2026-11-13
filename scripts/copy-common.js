import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsFiles = [
  'content.js',
  'background.js',
  'service-worker.js',
  'browser-polyfill.js',
];
const iconsDir = path.join(__dirname, '../icons');

// 跳过 .DS_Store 等隐藏文件，避免 macOS 元数据混入构建产物
function isVisibleFile(source) {
  return !path.basename(source).startsWith('.');
}

// 复制通用文件到 chrome 和 firefox 目录
async function copyFiles() {
  const srcDir = path.join(__dirname, '../src');
  const targets = ['chrome', 'firefox'];

  for (const target of targets) {
    const targetDir = path.join(__dirname, '../dist', target);
    await fs.ensureDir(targetDir);

    for (const file of jsFiles) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(targetDir, file);

      if (await fs.pathExists(srcFile)) {
        await fs.copy(srcFile, destFile);
      }
    }

    if (await fs.pathExists(iconsDir)) {
      await fs.copy(iconsDir, path.join(targetDir, 'icons'), { filter: isVisibleFile });
    }
  }
}

copyFiles().catch(console.error);