// Este script cria os arquivos de credenciais do Google Drive a partir das variáveis de ambiente
const fs = require('fs');
const path = require('path');

function writeIfEnv(varName, fileName) {
  let content = process.env[varName];
  if (!content) {
    console.warn(`[CRED] Variável ${varName} não encontrada, ${fileName} não será criado.`);
    return;
  }

  try {
    // Se for uma string JSON, valida e reformata
    let finalContent = content;
    if (content.startsWith('{') || content.startsWith('[')) {
      try {
        const parsed = JSON.parse(content);
        finalContent = JSON.stringify(parsed, null, 2);
        console.log(`[CRED] ${varName} parseado como JSON válido`);
      } catch (e) {
        console.warn(`[CRED] Aviso: ${varName} não é um JSON válido, salvando como string plana`);
      }
    }

    const filePath = path.join(__dirname, '..', fileName);
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`[CRED] ✓ ${fileName} criado com sucesso em ${filePath}`);
    console.log(`[CRED] Tamanho: ${finalContent.length} bytes`);
  } catch (err) {
    console.error(`[CRED] ✗ Erro ao criar ${fileName}:`, err.message);
  }
}

console.log('[CRED] Iniciando geração de arquivos de credenciais...');
writeIfEnv('GOOGLE_CREDENTIALS_JSON', 'google-credentials.json');
writeIfEnv('GOOGLE_TOKEN_JSON', 'google-token.json');
console.log('[CRED] Processo finalizado.');
