import webExt from 'web-ext';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function publishToFirefox() {
  try {
    const distDir = path.join(__dirname, '../dist');
    const extensionPath = path.join(distDir, 'firefox');
    const packageJson = await fs.readJson(path.join(__dirname, '../package.json'));
    const version = packageJson.version;

    const result = await webExt.cmd.sign({
      sourceDir: extensionPath,
      artifactsDir: distDir,
      channel: 'unlisted',
      apiKey: process.env.AMO_JWT_ISSUER,
      apiSecret: process.env.AMO_JWT_SECRET,
      timeout: 5 * 60 * 1000,
      verbose: true
    });

    // AMO 会把签名文件写到 artifactsDir，文件名由服务端决定；
    // 复制为构建脚本约定的名称，供 GitHub Release 的 *-v*.xpi 匹配并上传。
    const signedFile = (result.downloadedFiles || []).find(file => file.endsWith('.xpi'));
    if (!signedFile) {
      throw new Error('未找到 AMO 返回的签名 xpi 文件');
    }

    const targetFile = path.join(distDir, `firefox-v${version}.xpi`);
    if (path.resolve(signedFile) !== path.resolve(targetFile)) {
      await fs.copy(signedFile, targetFile, { overwrite: true });
    }

    console.log('Firefox extension published successfully!');
    console.log('Signed artifact:', targetFile);
  } catch (error) {
    console.error('Error publishing Firefox extension:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

publishToFirefox();
