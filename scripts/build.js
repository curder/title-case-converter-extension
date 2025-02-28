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

async function buildExtension() {
  try {
    const manifestSource = browser === 'firefox' ? 'manifest.firefox.json' : 'manifest.json';
    const targetDir = path.join(__dirname, '../dist', browser);
    const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, '../package.json'), 'utf8'));
    const version = packageJson.version;

    // 读取基础 manifest 文件
    const baseManifest = await fs.readJson(path.join(__dirname, '../src/manifest.json'));

    // 读取浏览器特定的 manifest 文件（如果存在）
    let browserSpecificManifest = {};
    const browserManifestPath = path.join(__dirname, '../src', manifestSource);
    if (await fs.pathExists(browserManifestPath)) {
      browserSpecificManifest = await fs.readJson(browserManifestPath);
    }

    // 合并 manifest 文件并确保必要的字段
    const finalManifest = {
      ...baseManifest,
      ...browserSpecificManifest,
      name: packageJson.name,
      description: packageJson.description,
      version: version,
    };

    // 确保目标目录存在
    await fs.ensureDir(targetDir);

    // 写入合并后的 manifest
    await fs.writeJson(
      path.join(targetDir, 'manifest.json'),
      finalManifest,
      { spaces: 2 }
    );

    // 创建压缩文件
    const output = fs.createWriteStream(
      path.join(__dirname, `../dist/${browser}-v${version}.${browser === 'firefox' ? 'xpi' : 'zip'}`)
    );
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(targetDir, false);
    await archive.finalize();

    console.log(`${browser} extension built successfully!`);
  } catch (error) {
    console.error(`Error building ${browser} extension:`, error);
    process.exit(1);
  }
}

buildExtension(); 