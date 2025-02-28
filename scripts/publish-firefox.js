const webExt = require('web-ext');
const path = require('path');

async function publishToFirefox() {
  try {
    const extensionPath = path.join(__dirname, '../dist/firefox');
    
    const result = await webExt.cmd.sign({
      sourceDir: extensionPath,
      artifactsDir: path.join(__dirname, '../dist'),
      channel: 'listed',
      apiKey: process.env.AMO_JWT_ISSUER,
      apiSecret: process.env.AMO_JWT_SECRET,
    });

    console.log('Firefox extension published successfully!');
    console.log('Download URL:', result.downloadUrl);
  } catch (error) {
    console.error('Error publishing Firefox extension:', error);
    process.exit(1);
  }
}

publishToFirefox(); 