const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const candidates = [
  'reconciliacao_final.xlsx',
  'reconciliacao_final.csv',
  'jan_corrigido.csv',
  'Novo(a) WinRAR ZIP archive.zip',
  'ngrok.exe',
  path.join('cloudflared-windows-amd64', 'cloudflared-windows-amd64.exe'),
  path.join('backend', 'uploads - Atalho.lnk')
];

console.log('Running clean script...');
let removed = [];
let notFound = [];

candidates.forEach(rel => {
  const full = path.join(root, rel);
  try {
    if (fs.existsSync(full)) {
      const stat = fs.lstatSync(full);
      if (stat.isDirectory()) {
        fs.rmSync(full, { recursive: true, force: true });
      } else {
        fs.rmSync(full, { force: true });
      }
      removed.push(rel);
    } else {
      notFound.push(rel);
    }
  } catch (err) {
    console.error('Error removing', rel, err.message);
  }
});

console.log('\nSummary:');
console.log(' Removed:', removed.length ? '\n  - ' + removed.join('\n  - ') : '  (none)');
console.log(' Not found:', notFound.length ? '\n  - ' + notFound.join('\n  - ') : '  (none)');
console.log('\nDone.');
