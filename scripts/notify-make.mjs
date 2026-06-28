// Avisa o Make.com que os videos ficaram prontos, devolvendo os links do Drive
// e o row_id da planilha. O Make retoma daqui (Canva + YouTube + atualizar Sheets).
import fsp from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BUILD = path.join(ROOT, 'build');

const run = async () => {
  const url = process.env.MAKE_CALLBACK_URL;
  if (!url) {
    console.log('MAKE_CALLBACK_URL não configurado — pulando notificação do Make');
    return;
  }

  let result = {};
  try {
    result = JSON.parse(await fsp.readFile(path.join(BUILD, 'upload-result.json'), 'utf8'));
  } catch (_) {
    console.log('upload-result.json não encontrado — enviando notificação sem links do Drive');
  }

  let youtubeResult = null;
  try {
    youtubeResult = JSON.parse(await fsp.readFile(path.join(BUILD, 'youtube-result.json'), 'utf8'));
  } catch (_) {
    // YouTube não configurado — ignora
  }

  const payload = {
    ...result,
    status: 'rendered',
    ...(youtubeResult && {youtube: youtubeResult}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.warn(`Aviso: Callback do Make retornou ${res.status} — verifique se o webhook está ativo`);
    return;
  }
  console.log('Make avisado. row_id:', result.row_id);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
