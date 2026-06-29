// Renderiza thumbnails como JPG usando Remotion still.
// Saída: out/thumbnail_longo.jpg e out/thumbnail_short.jpg
import fsp from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const ROOT = process.cwd();

const renderStill = (compositionId, outputFile, props) => {
  const args = [
    'remotion', 'still',
    compositionId,
    outputFile,
    '--props', JSON.stringify(props),
    '--image-format', 'jpeg',
    '--quality', '92',
    '--log', 'verbose',
  ];
  console.log(`Renderizando ${compositionId} → ${outputFile}`);
  const r = spawnSync('npx', args, {stdio: 'inherit', cwd: ROOT});
  if (r.status !== 0) throw new Error(`Remotion still falhou para ${compositionId}`);
};

const run = async () => {
  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));

  const veredicto = props.veredicto || 'PIRITA';
  const tituloLongo = props.titulo_longo || props.titulo || props.row_id || 'Vídeo';
  const tituloShort = props.titulo_short || tituloLongo;

  await fsp.mkdir(path.join(ROOT, 'out'), {recursive: true});

  renderStill('ThumbnailLongo', path.join(ROOT, 'out/thumbnail_longo.jpg'), {
    titulo: tituloLongo,
    veredicto,
  });

  renderStill('ThumbnailShort', path.join(ROOT, 'out/thumbnail_short.jpg'), {
    titulo: tituloShort,
    veredicto,
  });

  console.log('Thumbnails gerados: out/thumbnail_longo.jpg, out/thumbnail_short.jpg');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
