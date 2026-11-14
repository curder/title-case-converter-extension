import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(__dirname, '../dist/chrome');
const targetDir = path.join(__dirname, '../dist/chrome-e2e');
const HOST_PATTERN = 'http://127.0.0.1/*';

/**
 * 生成 e2e 专用产物：复制生产构建后附加测试域名的 host_permissions。
 * Playwright 无法触发扩展快捷键或工具栏点击，拿不到 activeTab 授权，
 * 因此用测试专用 manifest 驱动按需注入；生产包不包含该权限。
 */
async function prepareE2E() {
  if (!(await fs.pathExists(sourceDir))) {
    throw new Error('请先执行 pnpm run build:chrome');
  }

  await fs.remove(targetDir);
  await fs.copy(sourceDir, targetDir);

  const manifestPath = path.join(targetDir, 'manifest.json');
  const manifest = await fs.readJson(manifestPath);
  manifest.host_permissions = [HOST_PATTERN];
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });

  console.log(`e2e extension prepared: ${targetDir} (host_permissions: ${HOST_PATTERN})`);
}

prepareE2E().catch((error) => {
  console.error(error);
  process.exit(1);
});
