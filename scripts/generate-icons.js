const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceImage = path.join(__dirname, '../public/nano-banana-transparent-removebg-preview.png');
const outputDir = path.join(__dirname, '../public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Define all icon sizes and formats needed
const iconSizes = [
  // Favicon sizes
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },

  // Apple Touch Icons
  { size: 57, name: 'apple-touch-icon-57x57.png' },
  { size: 60, name: 'apple-touch-icon-60x60.png' },
  { size: 72, name: 'apple-touch-icon-72x72.png' },
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 114, name: 'apple-touch-icon-114x114.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 144, name: 'apple-touch-icon-144x144.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // Default Apple touch icon

  // Android Chrome icons
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },

  // Web app manifest icons
  { size: 144, name: 'icon-144x144.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },

  // Open Graph / Social sharing
  { width: 1200, height: 630, name: 'og-image.png' },
];

async function generateIcons() {
  console.log('Starting icon generation...');

  for (const icon of iconSizes) {
    try {
      const outputPath = path.join(outputDir, icon.name);

      if (icon.width && icon.height) {
        // For open graph image with specific dimensions
        await sharp(sourceImage)
          .resize(icon.width, icon.height, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png({ quality: 90 })
          .toFile(outputPath);
      } else {
        // For square icons
        await sharp(sourceImage)
          .resize(icon.size, icon.size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
          })
          .png({ quality: 90 })
          .toFile(outputPath);
      }

      console.log(`Generated: ${icon.name}`);
    } catch (error) {
      console.error(`Error generating ${icon.name}:`, error);
    }
  }

  // Generate ICO favicon
  try {
    console.log('Generating favicon.ico...');
    await sharp(sourceImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, 'favicon.ico'));
    console.log('Generated: favicon.ico');
  } catch (error) {
    console.error('Error generating favicon.ico:', error);
  }

  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);