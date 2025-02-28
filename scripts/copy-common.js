import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonFiles = [
  'content.js',
  'popup.html',
  'popup.js',
  'style.css',
  'icon16.png',
  'icon48.png',
  'icon128.png'
];

// 复制通用文件到 chrome 和 firefox 目录
async function copyCommonFiles() {
  const srcDir = path.join(__dirname, '../src');
  const targets = ['chrome', 'firefox'];

  for (const target of targets) {
    const targetDir = path.join(__dirname, '../dist', target);
    await fs.ensureDir(targetDir);

    for (const file of commonFiles) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(targetDir, file);

      if (await fs.pathExists(srcFile)) {
        await fs.copy(srcFile, destFile);
      }
    }
  }
}

copyCommonFiles().catch(console.error); 