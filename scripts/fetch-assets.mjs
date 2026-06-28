// Le props.json (client_payload do webhook), baixa audio + clipes para /public,
// converte audio p/ wav 16k (whisper) e gera build/*.props.json com caminhos locais.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public');
const TMP = path.join(ROOT, 'tmp');
const BUILD = path.join(ROOT, 'build');

const sh = (cmd, args) => {
  const r = spawnSync(cmd, args, {stdio: 'inherit'});
  if (r.status !== 0) throw new Error(`${cmd} falhou (${r.status})`);
};

const probeDuration = (file) => {
  const r = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file,
  ]);
  return parseFloat(String(r.stdout).trim()) || 60;
};

const fileExists = (p) => fs.existsSync(p);

const download = async (url, dest) => {
  // Pula se já existe (gerado por generate-audio ou fetch-clips)
  if (fileExists(dest)) {
    console.log(`[cache] ${path.relative(ROOT, dest)}`);
    return;
  }
  // Pula se não é URL remota (ex: "local" ou path relativo)
  if (!url.startsWith('http')) {
    console.log(`[skip] ${url}`);
    return;
  }
  await fsp.mkdir(path.dirname(dest), {recursive: true});
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download falhou ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(dest, buf);
};

const run = async () => {
  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));
  await fsp.mkdir(PUB, {recursive: true});
  await fsp.mkdir(TMP, {recursive: true});
  await fsp.mkdir(BUILD, {recursive: true});

  // ----- audio -----
  await download(props.audio_longo_url, path.join(PUB, 'audio/longo.mp3'));
  await download(props.audio_short_url, path.join(PUB, 'audio/short.mp3'));

  // wav 16k mono p/ whisper
  sh('ffmpeg', ['-y', '-i', path.join(PUB, 'audio/longo.mp3'), '-ar', '16000', '-ac', '1', path.join(TMP, 'longo.wav')]);
  sh('ffmpeg', ['-y', '-i', path.join(PUB, 'audio/short.mp3'), '-ar', '16000', '-ac', '1', path.join(TMP, 'short.wav')]);

  // ----- clipes -----
  const clipsLongo = [];
  for (let i = 0; i < (props.clipes_longo || []).length; i++) {
    const rel = `clips/long/${i}.mp4`;
    await download(props.clipes_longo[i], path.join(PUB, rel));
    clipsLongo.push(rel);
  }
  const clipsShort = [];
  for (let i = 0; i < (props.clipes_short || []).length; i++) {
    const rel = `clips/short/${i}.mp4`;
    await download(props.clipes_short[i], path.join(PUB, rel));
    clipsShort.push(rel);
  }

  const longoProps = {
    titulo: props.titulo_longo,
    veredicto: props.veredicto,
    audioSrc: 'audio/longo.mp3',
    clips: clipsLongo,
    captions: [],
    audioDurationInSeconds: probeDuration(path.join(PUB, 'audio/longo.mp3')),
    ganchoTexto: '',
  };
  const shortProps = {
    titulo: props.titulo_short,
    veredicto: props.veredicto,
    audioSrc: 'audio/short.mp3',
    clips: clipsShort,
    captions: [],
    audioDurationInSeconds: probeDuration(path.join(PUB, 'audio/short.mp3')),
    ganchoTexto: props.gancho_short || '',
  };

  await fsp.writeFile(path.join(BUILD, 'longo.props.json'), JSON.stringify(longoProps, null, 2));
  await fsp.writeFile(path.join(BUILD, 'short.props.json'), JSON.stringify(shortProps, null, 2));
  console.log('Assets prontos. Longo:', longoProps.audioDurationInSeconds.toFixed(1), 's | Short:', shortProps.audioDurationInSeconds.toFixed(1), 's');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
