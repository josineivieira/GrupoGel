#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Iniciando build do frontend...');

try {
  // Mudar para diretório frontend
  const frontendDir = path.join(__dirname, 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    console.log('❌ Diretório frontend não encontrado!');
    process.exit(1);
  }

  // Install
  console.log('📦 Instalando dependências...');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

  // Build
  console.log('🔨 Compilando React...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

  console.log('✅ Build completado com sucesso!');
} catch (error) {
  console.error('❌ Erro durante build:', error.message);
  process.exit(1);
}
