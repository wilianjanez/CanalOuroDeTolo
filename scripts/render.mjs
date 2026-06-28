// Renderiza VideoLongo (16:9) e Short (9:16) a partir de build/*.props.json.
import fsp from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';

const ROOT = process.cwd();
const BUILD = path.join(ROOT, 'build');
const OUT = path.join(ROOT, 'out');

const run = async () => {
  await fsp.mkdir(OUT, {recursive: true});
  console.log('Empacotando projeto Remotion...');
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, 'src/index.ts'),
    publicDir: path.join(ROOT, 'public'),
  });

  const jobs = [
    {id: 'VideoLongo', props: 'longo.props.json', out: 'longo.mp4'},
    {id: 'Short', props: 'short.props.json', out: 'short.mp4'},
  ];

  for (const job of jobs) {
    const inputProps = JSON.parse(await fsp.readFile(path.join(BUILD, job.props), 'utf8'));
    const composition = await selectComposition({serveUrl, id: job.id, inputProps});
    console.log(`Renderizando ${job.id} (${composition.durationInFrames} frames)...`);
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      crf: 20,
      inputProps,
      outputLocation: path.join(OUT, job.out),
      concurrency: Number(process.env.RENDER_CONCURRENCY) || null,
    });
    console.log(`OK -> out/${job.out}`);
  }
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
