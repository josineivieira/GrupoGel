const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Carrega as credenciais do Google (você precisará gerar um arquivo credentials.json no Google Cloud Console)
const CREDENTIALS_PATH = path.join(__dirname, '../../google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../google-token.json');

function getOAuth2Client() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
  }
  return oAuth2Client;
}

async function uploadFileToDrive(buffer, filename, mimetype) {
  const auth = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [process.env.GDRIVE_FOLDER_ID], // precisa criar uma pasta e colocar o ID aqui
    },
    media: {
      mimeType: mimetype,
      body: buffer instanceof Buffer ? buffer : Buffer.from(buffer),
    },
    fields: 'id,webViewLink,webContentLink',
  });
  return res.data;
}

module.exports = { uploadFileToDrive };
