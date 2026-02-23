/**
 * Gera icon-192.png e icon-512.png a partir de src/app/icon.svg para o PWA.
 * Requer: npm install -D sharp
 * Uso: node scripts/generate-pwa-icons.cjs
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'src', 'app', 'icon.svg');
const publicDir = path.join(root, 'public');
const svg = fs.readFileSync(svgPath);

async function run() {
  for (const size of [192, 512]) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`));
    console.log('Gerado public/icon-' + size + '.png');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
