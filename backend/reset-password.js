#!/usr/bin/env node
/**
 * Script para resetar/definir senha de um usuário no MockDB
 * Trata ambos os arquivos: data/db.json e data/{city}/db.json
 * Uso: node reset-password.js <username> <nova_senha> [city]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

function updateUserPassword(filePath, username, newPassword) {
  if (!fs.existsSync(filePath)) {
    return { success: false, error: `Arquivo não encontrado: ${filePath}` };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const driver = data.drivers.find(d => d.username.toLowerCase() === username.toLowerCase());
    
    if (!driver) {
      return { success: false, error: `Usuário "${username}" não encontrado neste arquivo` };
    }
    
    const hashedPassword = hashPassword(newPassword);
    driver.password = hashedPassword;
    driver.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true, file: filePath, driver };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
📝 Resetar Senha de Usuário

Uso: node reset-password.js <username> <nova_senha> [city]

Exemplos:
  node reset-password.js "josinei vieira" "minhasenha123"
  node reset-password.js "josinei vieira" "minhasenha123" manaus
  node reset-password.js "josinei vieira" "minhasenha123" itajai

Se [city] não for especificada, atualiza todos os arquivos encontrados.
`);
  process.exit(1);
}

const username = args[0];
const newPassword = args[1];
const city = args[2];

// Determinar quais arquivos atualizar
const baseDir = path.join(__dirname, './data');
const filesToUpdate = [];

if (city) {
  const cityPath = path.join(baseDir, city, 'db.json');
  filesToUpdate.push(cityPath);
} else {
  // Atualizar todos os arquivos
  filesToUpdate.push(path.join(baseDir, 'db.json'));
  
  // Procurar por arquivos de cidades
  if (fs.existsSync(baseDir)) {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dbPath = path.join(baseDir, entry.name, 'db.json');
        if (fs.existsSync(dbPath)) {
          filesToUpdate.push(dbPath);
        }
      }
    }
  }
}

if (filesToUpdate.length === 0) {
  console.error('❌ Nenhum arquivo de banco encontrado');
  process.exit(1);
}

let allSuccess = true;
let drivers = [];

console.log(`\n🔐 Atualizando senha para: ${username}`);
console.log(`Arquivos a atualizar: ${filesToUpdate.length}\n`);

for (const file of filesToUpdate) {
  const result = updateUserPassword(file, username, newPassword);
  
  if (result.success) {
    console.log(`✅ ${file}`);
    drivers.push(result.driver);
  } else {
    console.log(`⚠️  ${file}: ${result.error}`);
  }
}

if (drivers.length > 0) {
  console.log(`
\n✅ Senha atualizada com sucesso em ${drivers.length} arquivo(s)!\n`);
  
  const driver = drivers[0];
  console.log(`Detalhes do usuário:`);
  console.log(`  Usuário: ${driver.username}`);
  console.log(`  Role: ${driver.role}`);
  console.log(`  Email: ${driver.email}`);
  console.log(`\n🎯 Credenciais de login:`);
  console.log(`  Usuário: ${driver.username}`);
  console.log(`  Senha: ${newPassword}`);
} else {
  console.error(`\n❌ Falha ao atualizar a senha`);
  process.exit(1);
}

