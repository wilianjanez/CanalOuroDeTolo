// Roda UMA VEZ localmente para obter o refresh_token do YouTube.
// Uso: YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... node scripts/setup-youtube-auth.mjs
// Depois salve o refresh_token como secret YOUTUBE_REFRESH_TOKEN no GitHub.
import http from 'node:http';
import url from 'node:url';
import {google} from 'googleapis';

const PORT = 8085;
const REDIRECT = `http://localhost:${PORT}/callback`;

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Defina YOUTUBE_CLIENT_ID e YOUTUBE_CLIENT_SECRET antes de rodar.');
  process.exit(1);
}

const auth = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);

const authUrl = auth.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
  prompt: 'consent',
});

console.log('\n1. Abra este URL no browser:\n');
console.log(authUrl);
console.log(`\n2. Aguardando callback em http://localhost:${PORT}...\n`);

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname !== '/callback') {
    res.end('...');
    return;
  }

  const code = parsed.query.code;
  if (!code) {
    res.end('<h1>Erro: código de autorização ausente.</h1>');
    server.close();
    return;
  }

  res.end('<h1>Autorizado! Pode fechar esta janela.</h1>');
  server.close();

  try {
    const {tokens} = await auth.getToken(code);
    console.log('\n✅ Refresh token obtido. Salve como secret YOUTUBE_REFRESH_TOKEN:\n');
    console.log(tokens.refresh_token);
    console.log('');
  } catch (e) {
    console.error('Erro ao trocar o código pelo token:', e.message);
    process.exit(1);
  }
});

server.listen(PORT);
