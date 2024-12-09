import fs from 'fs-extra'

async function copyFile() {
  try {
    await fs.copy('docs/index.html', 'docs/404.html');
    console.log('File copied successfully');
  } catch (err) {
    console.error('Error copying file:', err);
    process.exit(1);
  }
}

copyFile();
