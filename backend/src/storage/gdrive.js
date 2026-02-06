const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Carrega as credenciais do Google (você precisará gerar um arquivo credentials.json no Google Cloud Console)
const CREDENTIALS_PATH = path.join(__dirname, '../../google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../google-token.json');

function getOAuth2Client() {
  try {
    // Verifica se os arquivos existem
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Arquivo de credenciais não encontrado: ${CREDENTIALS_PATH}`);
    }
    
    if (!fs.existsSync(TOKEN_PATH)) {
      throw new Error(`Arquivo de token não encontrado: ${TOKEN_PATH}`);
    }

    console.log('[GDRIVE] Carregando credenciais de:', CREDENTIALS_PATH);
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    
    // Accept both 'installed' (desktop) and 'web' (web app) credential formats
    const credRoot = credentials.installed || credentials.web;
    if (!credRoot) {
      throw new Error('Estrutura de credenciais inválida: missing "installed" or "web" property');
    }

    const { client_secret, client_id, redirect_uris } = credRoot;
    
    if (!client_id || !client_secret || !redirect_uris) {
      throw new Error('Credenciais incompletas: faltam client_id, client_secret ou redirect_uris');
    }

    console.log('[GDRIVE] Credenciais carregadas com sucesso');
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      console.log('[GDRIVE] Token carregado e configurado');
      oAuth2Client.setCredentials(token);
    }
    
    return oAuth2Client;
  } catch (err) {
    console.error('[GDRIVE] Erro ao carregar OAuth2Client:', err.message);
    throw err;
  }
}

async function uploadFileToDrive(buffer, filename, mimetype) {
  try {
    const auth = getOAuth2Client();
    const folderId = process.env.GDRIVE_FOLDER_ID;
    
    if (!folderId) {
      throw new Error('GDRIVE_FOLDER_ID não está definido nas variáveis de ambiente');
    }

    console.log(`[GDRIVE] Iniciando upload de ${filename} para pasta ${folderId}`);
    
    const drive = google.drive({ version: 'v3', auth });
    const res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: mimetype,
        body: buffer instanceof Buffer ? buffer : Buffer.from(buffer),
      },
      fields: 'id,webViewLink,webContentLink',
    });
    
    console.log(`[GDRIVE] ✓ Arquivo ${filename} enviado com sucesso. ID: ${res.data.id}`);
    return res.data;
  } catch (err) {
    console.error('[GDRIVE] ✗ Erro ao fazer upload:', err.message);
    throw err;
  }
}

module.exports = { uploadFileToDrive };
