// Gera narração MP3 a partir de props.roteiro_longo e props.roteiro_short.
// Backend automático:
//   - Se ELEVENLABS_API_KEY definido → ElevenLabs (pago)
//   - Caso contrário               → edge-tts (Microsoft neural, grátis)
import fsp from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public');
const TMP = path.join(ROOT, 'tmp');

// ── edge-tts (grátis) ────────────────────────────────────────────────────────

const synthesizeEdge = async (text, voice, destPath) => {
  // Instala edge-tts se necessário (python3 disponível no ubuntu-latest e no Windows com Python)
  const install = spawnSync('pip3', ['install', '--quiet', '--disable-pip-version-check', 'edge-tts'], {stdio: 'inherit'});
  if (install.status !== 0) throw new Error('Falha ao instalar edge-tts via pip3');

  await fsp.mkdir(path.dirname(destPath), {recursive: true});
  await fsp.mkdir(TMP, {recursive: true});

  // Escreve texto em arquivo temporário (evita problemas com args longos no shell)
  const textFile = path.join(TMP, `tts_${Date.now()}.txt`);
  await fsp.writeFile(textFile, text, 'utf8');

  const r = spawnSync('python3', [
    '-m', 'edge_tts',
    '--voice', voice,
    '--file', textFile,
    '--write-media', destPath,
  ], {stdio: 'inherit'});

  await fsp.unlink(textFile).catch(() => {});

  if (r.status !== 0) throw new Error(`edge-tts falhou para ${path.relative(ROOT, destPath)}`);
  console.log(`Áudio (edge-tts): ${path.relative(ROOT, destPath)}`);
};

// ── ElevenLabs (pago) ────────────────────────────────────────────────────────

const MAX_CHARS = 4900;

const synthesizeElevenChunk = async (text, voiceId, destPath, apiKey) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {'xi-api-key': apiKey, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {stability: 0.45, similarity_boost: 0.82, style: 0.15, use_speaker_boost: true},
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  await fsp.mkdir(path.dirname(destPath), {recursive: true});
  const buf = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(destPath, buf);
  console.log(`Áudio (ElevenLabs): ${path.relative(ROOT, destPath)} (${(buf.length / 1024).toFixed(0)} KB)`);
};

const synthesizeEleven = async (text, voiceId, destPath, apiKey) => {
  if (text.length <= MAX_CHARS) {
    await synthesizeElevenChunk(text, voiceId, destPath, apiKey);
    return;
  }
  // Divide em chunks por parágrafo
  const paragraphs = text.split(/\n+/).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n' + p).length > MAX_CHARS) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + '\n' + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const tmpDir = path.join(TMP, 'audio_chunks');
  await fsp.mkdir(tmpDir, {recursive: true});
  const chunkPaths = [];
  for (let i = 0; i < chunks.length; i++) {
    const cp = path.join(tmpDir, `chunk_${path.basename(destPath, '.mp3')}_${i}.mp3`);
    await synthesizeElevenChunk(chunks[i], voiceId, cp, apiKey);
    chunkPaths.push(cp);
  }
  const listFile = path.join(tmpDir, `list_${path.basename(destPath, '.mp3')}.txt`);
  await fsp.writeFile(listFile, chunkPaths.map(p => `file '${p}'`).join('\n'));
  const r = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', destPath], {stdio: 'inherit'});
  if (r.status !== 0) throw new Error('FFmpeg concat falhou');
};

// ── main ─────────────────────────────────────────────────────────────────────

const run = async () => {
  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));

  if (!props.roteiro_longo) {
    console.log('props.json sem roteiro — pulando geração de áudio');
    return;
  }

  const elevenKey = process.env.ELEVENLABS_API_KEY;

  if (elevenKey) {
    console.log('Backend: ElevenLabs');
    const voiceIdLongo = process.env.ELEVENLABS_VOICE_ID_LONGO;
    const voiceIdShort = process.env.ELEVENLABS_VOICE_ID_SHORT || voiceIdLongo;
    if (!voiceIdLongo) throw new Error('Falta ELEVENLABS_VOICE_ID_LONGO');
    await synthesizeEleven(props.roteiro_longo, voiceIdLongo, path.join(PUB, 'audio/longo.mp3'), elevenKey);
    await synthesizeEleven(props.roteiro_short, voiceIdShort, path.join(PUB, 'audio/short.mp3'), elevenKey);
  } else {
    console.log('Backend: edge-tts (Microsoft Neural, grátis)');
    const voiceLongo = process.env.EDGE_TTS_VOICE_LONGO || 'pt-BR-AntonioNeural';
    const voiceShort = process.env.EDGE_TTS_VOICE_SHORT || voiceLongo;
    await synthesizeEdge(props.roteiro_longo, voiceLongo, path.join(PUB, 'audio/longo.mp3'));
    await synthesizeEdge(props.roteiro_short, voiceShort, path.join(PUB, 'audio/short.mp3'));
  }
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
