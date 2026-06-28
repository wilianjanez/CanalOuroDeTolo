// Gera narração MP3 via ElevenLabs a partir de props.roteiro_longo e props.roteiro_short.
// Escreve public/audio/longo.mp3 e public/audio/short.mp3.
import fsp from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public');
const MAX_CHARS = 4900; // limite seguro ElevenLabs por chamada

const synthesize = async (text, voiceId, destPath) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('Falta ELEVENLABS_API_KEY');

  // Se o texto é maior que o limite, parte em chunks por parágrafo
  if (text.length <= MAX_CHARS) {
    await synthesizeChunk(text, voiceId, destPath, apiKey);
    return;
  }

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

  const tmpDir = path.join(ROOT, 'tmp', 'audio_chunks');
  await fsp.mkdir(tmpDir, {recursive: true});

  const chunkPaths = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = path.join(tmpDir, `chunk_${path.basename(destPath, '.mp3')}_${i}.mp3`);
    await synthesizeChunk(chunks[i], voiceId, chunkPath, apiKey);
    chunkPaths.push(chunkPath);
  }

  // Concatena com FFmpeg
  const {spawnSync} = await import('node:child_process');
  const listFile = path.join(tmpDir, `list_${path.basename(destPath, '.mp3')}.txt`);
  await fsp.writeFile(listFile, chunkPaths.map(p => `file '${p}'`).join('\n'));
  const r = spawnSync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', destPath], {stdio: 'inherit'});
  if (r.status !== 0) throw new Error('FFmpeg concat falhou');
  console.log(`Áudio concatenado (${chunks.length} chunks): ${path.relative(ROOT, destPath)}`);
};

const synthesizeChunk = async (text, voiceId, destPath, apiKey) => {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.82,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err}`);
  }

  await fsp.mkdir(path.dirname(destPath), {recursive: true});
  const buf = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(destPath, buf);
  console.log(`Áudio: ${path.relative(ROOT, destPath)} (${(buf.length / 1024).toFixed(0)} KB, ${text.length} chars)`);
};

const run = async () => {
  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));

  if (!props.roteiro_longo) {
    console.log('props.json sem roteiro — pulando geração de áudio');
    return;
  }

  const voiceIdLongo = process.env.ELEVENLABS_VOICE_ID_LONGO;
  const voiceIdShort = process.env.ELEVENLABS_VOICE_ID_SHORT || voiceIdLongo;
  if (!voiceIdLongo) throw new Error('Falta ELEVENLABS_VOICE_ID_LONGO');

  await synthesize(props.roteiro_longo, voiceIdLongo, path.join(PUB, 'audio/longo.mp3'));
  await synthesize(props.roteiro_short, voiceIdShort, path.join(PUB, 'audio/short.mp3'));
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
