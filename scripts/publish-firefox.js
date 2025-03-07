import webExt from 'web-ext';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function publishToFirefox() {
  try {
    const extensionPath = path.join(__dirname, '../dist/firefox');
    
    const result = await webExt.cmd.sign({
      sourceDir: extensionPath,
      artifactsDir: path.join(__dirname, '../dist'),
      channel: 'unlisted',
      apiKey: process.env.AMO_JWT_ISSUER,
      apiSecret: process.env.AMO_JWT_SECRET,
      timeout: 5 * 60 * 1000,
      verbose: true
    });

    console.log('Firefox extension published successfully!');
    console.log('Download URL:', result.downloadUrl);
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