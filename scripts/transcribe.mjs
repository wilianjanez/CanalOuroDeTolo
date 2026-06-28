// Gera legendas com whisper.cpp (open source) a partir dos wav 16k.
// Escreve public/captions/{longo,short}.json e injeta nas build/*.props.json.
import fsp from 'node:fs/promises';
import path from 'node:path';
import {downloadWhisperModel, installWhisperCpp, transcribe, toCaptions} from '@remotion/install-whisper-cpp';

const ROOT = process.cwd();
const TMP = path.join(ROOT, 'tmp');
const PUB = path.join(ROOT, 'public');
const BUILD = path.join(ROOT, 'build');
const WHISPER = path.join(ROOT, 'whisper.cpp');
const MODEL = process.env.WHISPER_MODEL || 'small'; // 'medium' = melhor PT, mais lento

const transcribeOne = async (wavRel) => {
  const {transcription} = await transcribe({
    inputPath: path.join(TMP, wavRel),
    whisperPath: WHISPER,
    model: MODEL,
    tokenLevelTimestamps: true,
    language: 'pt',
  });
  const {captions} = toCaptions({whisperCppOutput: transcription});
  return captions.map((c) => ({text: c.text, startMs: c.startMs, endMs: c.endMs}));
};

const run = async () => {
  await installWhisperCpp({to: WHISPER, version: '1.5.5'});
  await downloadWhisperModel({model: MODEL, folder: WHISPER});
  await fsp.mkdir(path.join(PUB, 'captions'), {recursive: true});

  for (const name of ['longo', 'short']) {
    const caps = await transcribeOne(`${name}.wav`);
    await fsp.writeFile(path.join(PUB, 'captions', `${name}.json`), JSON.stringify(caps));
    const pf = path.join(BUILD, `${name}.props.json`);
    const props = JSON.parse(await fsp.readFile(pf, 'utf8'));
    props.captions = caps;
    await fsp.writeFile(pf, JSON.stringify(props, null, 2));
    console.log(`${name}: ${caps.length} legendas`);
  }
};

run().catch((e) => {
  console.error('Transcricao falhou (seguindo sem legendas):', e.message);
  // nao aborta o pipeline — video sai sem legenda se whisper falhar
  process.exit(0);
});
