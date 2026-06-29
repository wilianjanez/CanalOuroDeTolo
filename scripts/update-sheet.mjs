// Atualiza o status do tema no temas/temas.xlsx local após o pipeline concluir.
// Usa o row_id (número da linha, incluindo o cabeçalho) para localizar a linha.
// Depois faz git commit + push de volta ao repositório.
import fsp from 'node:fs/promises';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = process.cwd();
const SHEET_PATH = path.join(ROOT, 'temas', 'temas.xlsx');
const BUILD = path.join(ROOT, 'build');

// Colunas da planilha (letra da coluna → índice 0-based)
const COL_STATUS = process.env.SHEETS_STATUS_COL  || 'D'; // Status
const COL_DATE   = process.env.SHEETS_DATE_COL    || 'F'; // Data de publicação
const COL_OBS    = process.env.SHEETS_OBS_COL     || 'G'; // Observações
const STATUS_VAL = process.env.SHEETS_STATUS_VALUE || 'publicado';

const colIndex = (letter) => letter.toUpperCase().charCodeAt(0) - 65; // A=0, B=1…

const run = async () => {
  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));
  const rowId = parseInt(props.row_id, 10);

  if (!rowId || isNaN(rowId)) {
    console.log('props.json sem row_id numérico — pulando atualização da planilha');
    return;
  }

  // Verifica se o arquivo existe
  try {
    await fsp.access(SHEET_PATH);
  } catch (_) {
    console.log(`${SHEET_PATH} não encontrado — pulando atualização da planilha`);
    return;
  }

  // Lê YouTube URLs se disponíveis
  let youtubeResult = null;
  try {
    youtubeResult = JSON.parse(await fsp.readFile(path.join(BUILD, 'youtube-result.json'), 'utf8'));
  } catch (_) {}

  const today = new Date().toLocaleDateString('pt-BR');

  // Lê o workbook
  const workbook = XLSX.readFile(SHEET_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Obtém o range atual para garantir que o range seja expandido se necessário
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');

  // Atualiza célula de Status
  const statusCell = `${COL_STATUS}${rowId}`;
  sheet[statusCell] = {t: 's', v: STATUS_VAL};

  // Atualiza célula de Data
  const dateCell = `${COL_DATE}${rowId}`;
  sheet[dateCell] = {t: 's', v: today};

  // Atualiza Observações com links do YouTube (se disponíveis)
  if (youtubeResult) {
    const links = [
      youtubeResult.longo?.url && `Longo: ${youtubeResult.longo.url}`,
      youtubeResult.short?.url && `Short: ${youtubeResult.short.url}`,
    ].filter(Boolean).join(' | ');
    if (links) {
      const obsCell = `${COL_OBS}${rowId}`;
      sheet[obsCell] = {t: 's', v: links};
    }
  }

  // Garante que o range inclui as novas células
  const maxCol = Math.max(ref.e.c, colIndex(COL_OBS));
  sheet['!ref'] = XLSX.utils.encode_range({
    s: ref.s,
    e: {r: Math.max(ref.e.r, rowId - 1), c: maxCol},
  });

  // Salva o workbook
  XLSX.writeFile(workbook, SHEET_PATH);
  console.log(`Planilha atualizada: linha ${rowId} → Status="${STATUS_VAL}", Data="${today}"`);

  // Faz commit + push de volta ao repositório
  try {
    execSync('git config user.email "action@github.com"', {cwd: ROOT});
    execSync('git config user.name "GitHub Actions"', {cwd: ROOT});
    execSync(`git add temas/temas.xlsx`, {cwd: ROOT});
    execSync(`git commit -m "chore: marca linha ${rowId} como ${STATUS_VAL} [skip ci]"`, {cwd: ROOT});
    execSync(`git push`, {cwd: ROOT, env: {...process.env}});
    console.log('Planilha salva no repositório com sucesso.');
  } catch (e) {
    console.warn('Aviso: não foi possível fazer commit da planilha:', e.message);
  }
};

run().catch((e) => {
  console.warn('Aviso: erro ao atualizar planilha:', e.message);
  // Não trava o pipeline
});
