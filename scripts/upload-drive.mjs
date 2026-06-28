// Sobe out/longo.mp4 e out/short.mp4 para uma pasta do Google Drive
// usando OAuth2 do usuario (mesmos secrets do YouTube) e GDRIVE_FOLDER_ID.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {google} from 'googleapis';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'out');
const BUILD = path.join(ROOT, 'build');

const run = async () => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  const folderId = process.env.GDRIVE_FOLDER_ID;

  if (!clientId || !clientSecret || !refreshToken || !folderId) {
    console.log('Credenciais OAuth2 ou GDRIVE_FOLDER_ID não configurados — pulando upload para o Drive');
    return;
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');
  auth.setCredentials({refresh_token: refreshToken});
  const drive = google.drive({version: 'v3', auth});

  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));
  const stamp = new Date().toISOString().slice(0, 10);

  const upload = async (file, label) => {
    const res = await drive.files.create({
      requestBody: {name: `${stamp}_${props.row_id}_${label}.mp4`, parents: [folderId]},
      media: {mimeType: 'video/mp4', body: fs.createReadStream(path.join(OUT, file))},
      fields: 'id, webViewLink, webContentLink',
    });
    return {id: res.data.id, link: res.data.webViewLink, download: res.data.webContentLink};
  };

  const result = {
    row_id: props.row_id,
    longo: await upload('longo.mp4', 'longo'),
    short: await upload('short.mp4', 'short'),
  };
  await fsp.writeFile(path.join(BUILD, 'upload-result.json'), JSON.stringify(result, null, 2));
  console.log('Upload concluido:', result.longo.id, result.short.id);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
