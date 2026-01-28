const fs = require('fs');
const path = require('path');

// Caminhos
const srcBuild = path.join(__dirname, '../../frontend/build');
const destBuild = path.join(__dirname, '../public/build');

console.log('📦 Copiando frontend build...');
console.log('De:', srcBuild);
console.log('Para:', destBuild);

// Verificar se origem existe
if (!fs.existsSync(srcBuild)) {
  console.log('⚠️  Build do frontend não encontrado em:', srcBuild);
  console.log('Pulando cópia...');
  process.exit(0);
}

// Criar diretório destino se não existir
if (!fs.existsSync(path.dirname(destBuild))) {
  fs.mkdirSync(path.dirname(destBuild), { recursive: true });
}

// Função recursiva para copiar
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

try {
  copyRecursive(srcBuild, destBuild);
  console.log('✅ Build copiado com sucesso!');
} catch (err) {
  console.error('❌ Erro ao copiar build:', err.message);
  process.exit(1);
}
