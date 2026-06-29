// Atualiza o status do tema na planilha Google Sheets após o pipeline concluir.
// Requer secrets: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
// Requer secret: SHEETS_SPREADSHEET_ID (ID da planilha — parte da URL)
// Variáveis opcionais:
//   SHEETS_STATUS_COL   = coluna do Status          (padrão: D)
//   SHEETS_DATE_COL     = coluna da Data publicação  (padrão: F)
//   SHEETS_STATUS_VALUE = valor a gravar em Status   (padrão: publicado)
import fsp from 'node:fs/promises';
import path from 'node:path';
import {google} from 'googleapis';

const ROOT = process.cwd();
const BUILD = path.join(ROOT, 'build');

const run = async () => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;

  if (!clientId || !clientSecret || !refreshToken || !spreadsheetId) {
    console.log('Credenciais ou SHEETS_SPREADSHEET_ID não configurados — pulando atualização da planilha');
    return;
  }

  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));
  const rowId = props.row_id;

  if (!rowId) {
    console.log('props.json sem row_id — pulando atualização da planilha');
    return;
  }

  const statusCol  = process.env.SHEETS_STATUS_COL   || 'D';
  const dateCol    = process.env.SHEETS_DATE_COL     || 'F';
  const statusVal  = process.env.SHEETS_STATUS_VALUE || 'publicado';

  const auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');
  auth.setCredentials({refresh_token: refreshToken});
  const sheets = google.sheets({version: 'v4', auth});

  // Lê YouTube URLs se disponíveis
  let youtubeResult = null;
  try {
    youtubeResult = JSON.parse(await fsp.readFile(path.join(BUILD, 'youtube-result.json'), 'utf8'));
  } catch (_) {}

  const today = new Date().toLocaleDateString('pt-BR');

  // Atualiza Status e Data de publicação na mesma chamada
  const updates = [
    {
      range: `${statusCol}${rowId}`,
      values: [[statusVal]],
    },
    {
      range: `${dateCol}${rowId}`,
      values: [[today]],
    },
  ];

  // Se tiver URLs do YouTube, grava na coluna de Observações (G)
  if (youtubeResult) {
    const obsCol = process.env.SHEETS_OBS_COL || 'G';
    const links = [
      youtubeResult.longo?.url && `Longo: ${youtubeResult.longo.url}`,
      youtubeResult.short?.url && `Short: ${youtubeResult.short.url}`,
    ].filter(Boolean).join(' | ');
    if (links) {
      updates.push({range: `${obsCol}${rowId}`, values: [[links]]});
    }
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updates,
    },
  });

  console.log(`Planilha atualizada: linha ${rowId} → Status="${statusVal}", Data="${today}"`);
};

run().catch((e) => {
  if (e?.errors?.length) {
    console.warn(`Aviso: não foi possível atualizar a planilha: ${e.errors[0]?.message}`);
  } else {
    console.warn(`Aviso: não foi possível atualizar a planilha: ${e.message}`);
  }
  // Não trava o pipeline
});
