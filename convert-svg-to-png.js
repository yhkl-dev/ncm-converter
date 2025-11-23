#!/usr/bin/env node

/**
 * Convert SVG images to PNG for Chrome Web Store
 *
 * Install dependencies:
 * npm install -D sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const conversions = [
  { svg: 'icon-128x128.svg', png: 'icon.png', width: 128, height: 128 },
  { svg: 'promo-tile-440x280.svg', png: 'promo-tile-440x280.png', width: 440, height: 280 },
  { svg: 'promo-tile-300x200.svg', png: 'promo-tile-300x200.png', width: 300, height: 200 },
  { svg: 'screenshot-1280x800.svg', png: 'screenshot-1280x800.png', width: 1280, height: 800 },
  { svg: 'marquee-1400x560.svg', png: 'marquee-1400x560.png', width: 1400, height: 560 },
];

async function convertSvgToPng() {
  const assetsDir = path.join(__dirname, 'assets');
  let converted = 0;
  let failed = 0;

  console.log('Converting SVG to PNG for Chrome Web Store...\n');

  for (const { svg, png, width, height } of conversions) {
    const svgPath = path.join(assetsDir, svg);
    const pngPath = path.join(assetsDir, png);

    if (!fs.existsSync(svgPath)) {
      console.log(`⚠️  Skipping ${svg} - file not found`);
      continue;
    }

    try {
      console.log(`Converting ${svg}...`, '');

      await sharp(svgPath)
        .png()
        .resize(width, height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(pngPath);

      const stats = fs.statSync(pngPath);
      const sizeKb = (stats.size / 1024).toFixed(1);
      console.log(`✓ (${sizeKb} KB)`);
      converted++;
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✓ Successfully converted: ${converted} files`);

  if (failed > 0) {
    console.log(`✗ Failed to convert: ${failed} files`);
  }

  console.log('\n✓ Ready for Chrome Web Store upload!');
  process.exit(failed > 0 ? 1 : 0);
}

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (error) {
  console.error('Error: sharp is not installed');
  console.error('Install it with: npm install -D sharp');
  console.error('Or: pnpm add -D sharp');
  process.exit(1);
}

convertSvgToPng().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
