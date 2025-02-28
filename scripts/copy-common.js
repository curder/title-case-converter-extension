const fs = require('fs-extra');
const path = require('path');

async function copyCommonFiles() {
  const commonFiles = [
    { from: 'src/background.js', to: 'background.js' },
    { from: 'src/content.js', to: 'content.js' },
    { from: 'src/service-worker.js', to: 'service-worker.js' },
    { from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js', to: 'browser-polyfill.js' },
    { from: 'icons', to: 'icons' }
  ];

  const browsers = ['chrome', 'firefox'];

  try {
    for (const browser of browsers) {
      const distDir = path.join(__dirname, '..', 'dist', browser);
      await fs.ensureDir(distDir);

      for (const file of commonFiles) {
        await fs.copy(
          path.join(__dirname, '..', file.from),
          path.join(distDir, file.to)
        );
      }
    }

    console.log('✅ Successfully copied common files');
  } catch (err) {
    console.error('❌ Failed to copy common files:', err);
    process.exit(1);
  }
}

copyCommonFiles(); 