import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const browser = process.argv[2];
if (!browser) {
  console.error('Please specify browser: chrome or firefox');
  process.exit(1);
}

const manifestSource = browser === 'firefox' ? 'manifest.firefox.json' : 'manifest.json';
const targetDir = path.join(__dirname, '../dist', browser);
const version = JSON.parse(await fs.readFile('package.json', 'utf8')).version;

// 复制 manifest 文件
await fs.copy(
  path.join(__dirname, '../src', manifestSource),
  path.join(targetDir, 'manifest.json')
);

// 创建 zip 文件
const output = fs.createWriteStream(path.join(__dirname, `../dist/${browser}-v${version}.${browser === 'firefox' ? 'xpi' : 'zip'}`));
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(output);
archive.directory(targetDir, false);
await archive.finalize();

console.log(`${browser} extension built successfully!`); 