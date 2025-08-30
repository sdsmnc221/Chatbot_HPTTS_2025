const fs = require('fs');
const path = require('path');

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is not set');
  process.exit(1);
}

// Read the index.html file
let html = fs.readFileSync('index.html', 'utf8');

// Replace the process.env reference with the actual environment variable
html = html.replace(
  'process.env.GEMINI_API_KEY',
  `"${process.env.GEMINI_API_KEY}"`
);

// Create dist folder if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write to dist folder
fs.writeFileSync(path.join(distDir, 'index.html'), html);
console.log('Build complete! Generated dist/index.html');
