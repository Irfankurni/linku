const fs = require('fs');
const path = require('path');
const dir = './dist/frontend/server';

if (!fs.existsSync(dir)) {
  console.log('Directory not found:', dir);
  process.exit(0);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.mjs'));

files.forEach(f => {
  const p = path.join(dir, f);
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('import.meta.url')) {
    c = c.replace(/import\.meta\.url/g, '"file:///"');
    fs.writeFileSync(p, c);
    console.log('Patched import.meta.url in', p);
  }
});
