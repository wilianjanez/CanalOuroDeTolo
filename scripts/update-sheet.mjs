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

  // Diagnóstico: mostra o valor atual da célula de Status antes de alterar
  const statusCellRef = `${COL_STATUS}${rowId}`;
  const currentCell = sheet[statusCellRef];
  console.log(`Célula alvo: ${statusCellRef} | Valor atual: "${currentCell?.v ?? '(vazia)'}"`);

  // sheet_add_aoa é mais confiável que atribuição direta para cells existentes
  XLSX.utils.sheet_add_aoa(sheet, [[STATUS_VAL]], {
    origin: XLSX.utils.decode_cell(`${COL_STATUS}${rowId}`),
  });
  XLSX.utils.sheet_add_aoa(sheet, [[today]], {
    origin: XLSX.utils.decode_cell(`${COL_DATE}${rowId}`),
  });

  // Observações com links do YouTube
  if (youtubeResult) {
    const links = [
      youtubeResult.longo?.url && `Longo: ${youtubeResult.longo.url}`,
      youtubeResult.short?.url && `Short: ${youtubeResult.short.url}`,
    ].filter(Boolean).join(' | ');
    if (links) {
      XLSX.utils.sheet_add_aoa(sheet, [[links]], {
        origin: XLSX.utils.decode_cell(`${COL_OBS}${rowId}`),
      });
    }
  }

  // Garante que o range da sheet inclui as novas células
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const maxCol = Math.max(ref.e.c, colIndex(COL_OBS));
  sheet['!ref'] = XLSX.utils.encode_range({
    s: ref.s,
    e: {r: Math.max(ref.e.r, rowId - 1), c: maxCol},
  });

  // Salva sem shared strings (bookSST:false) para evitar problemas de referência
  XLSX.writeFile(workbook, SHEET_PATH, {bookSST: false});

  // Verifica se a célula foi mesmo alterada
  const afterCell = sheet[statusCellRef];
  console.log(`Célula após escrita: ${statusCellRef} = "${afterCell?.v}"`);
  console.log(`Planilha atualizada: linha ${rowId} → Status="${STATUS_VAL}", Data="${today}"`);

  // Faz commit + push de volta ao repositório
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('GITHUB_TOKEN não disponível — planilha salva localmente mas não commitada');
    return;
  }

  execSync('git config user.email "action@github.com"', {cwd: ROOT, stdio: 'inherit'});
  execSync('git config user.name "GitHub Actions"', {cwd: ROOT, stdio: 'inherit'});

  // Usa token na URL para autenticar o push
  execSync(
    `git remote set-url origin https://x-access-token:${token}@github.com/wilianjanez/CanalOuroDeTolo.git`,
    {cwd: ROOT, stdio: 'inherit'},
  );

  execSync(`git add temas/temas.xlsx`, {cwd: ROOT, stdio: 'inherit'});

  // Se não houver mudança no arquivo, pula o commit
  const status = execSync('git status --porcelain temas/temas.xlsx', {cwd: ROOT}).toString().trim();
  if (!status) {
    console.log('Planilha sem alterações detectadas — nada a commitar');
    return;
  }

  execSync(
    `git commit -m "chore: marca linha ${rowId} como ${STATUS_VAL} [skip ci]"`,
    {cwd: ROOT, stdio: 'inherit'},
  );
  execSync('git push origin HEAD', {cwd: ROOT, stdio: 'inherit'});
  console.log('✅ Planilha salva no repositório com sucesso.');
};

run().catch((e) => {
  console.error('ERRO ao atualizar planilha:', e.message);
  process.exit(1); // agora falha o pipeline para ser visível nos logs
});
