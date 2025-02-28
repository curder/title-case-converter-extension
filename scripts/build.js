const fs = require('fs-extra');
const path = require('path');

const browser = process.argv[2];
if (!browser || !['chrome', 'firefox'].includes(browser)) {
  console.error('Please specify browser: chrome or firefox');
  process.exit(1);
}

async function build() {
  try {
    // 使用绝对路径
    const rootDir = path.join(__dirname, '..', 'src');
    const distDir = path.join(rootDir, '..', 'dist', browser);

    // 确保 dist 目录存在
    await fs.ensureDir(distDir);

    // 读取基础 manifest 文件
    const baseManifest = await fs.readJson(path.join(rootDir, 'manifest.json'));

    // 读取浏览器特定的 manifest 文件
    const browserManifestPath = path.join(rootDir, `manifest.${browser}.json`);
    const browserManifest = await fs.readJson(browserManifestPath);

    // 合并 manifest 文件
    const finalManifest = {
      ...baseManifest,
      ...browserManifest
    };

    // 写入合并后的 manifest
    const outputPath = path.join(distDir, 'manifest.json');
    await fs.writeJson(outputPath, finalManifest, { spaces: 2 });

    console.log(`✅ Successfully built for ${browser}`);
    console.log(`   Manifest written to: ${outputPath}`);
  } catch (err) {
    console.error(`❌ Build failed for ${browser}:`, err);
    console.error('Error details:', err.message);
    process.exit(1);
  }
}

build(); 