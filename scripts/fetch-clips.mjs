// Busca e baixa clipes de stock do Pexels com base em clip_keywords do props.json.
// Escreve em public/clips/{long,short}/N.mp4 — mesmos paths que fetch-assets usaria.
import fsp from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public');

const fileExists = (p) => fsp.access(p).then(() => true).catch(() => false);

const searchPexels = async (query, orientation, count) => {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error('Falta PEXELS_API_KEY');

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=${orientation}&size=medium`;
  const res = await fetch(url, {headers: {Authorization: apiKey}});
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.videos || [];
};

const getBestFile = (video, preferPortrait) => {
  const files = (video.video_files || []).filter((f) => f.link && f.width && f.height);
  if (!files.length) return null;
  // Ordena por resolução decrescente; para short prefere relação 9:16
  const scored = files.map((f) => {
    const res = f.width * f.height;
    const ratio = f.height / f.width;
    const ratioBonus = preferPortrait ? (ratio > 1 ? 50_000_000 : 0) : (ratio < 1 ? 50_000_000 : 0);
    return {f, score: res + ratioBonus};
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].f.link;
};

const downloadClip = async (url, dest) => {
  if (await fileExists(dest)) {
    console.log(`[cache] ${path.relative(ROOT, dest)}`);
    return;
  }
  console.log(`Baixando clip: ${path.relative(ROOT, dest)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download do clip falhou ${res.status}: ${url}`);
  await fsp.mkdir(path.dirname(dest), {recursive: true});
  const buf = Buffer.from(await res.arrayBuffer());
  await fsp.writeFile(dest, buf);
  console.log(`  -> ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
};

const fetchClipsFor = async (keywords, format, totalClips) => {
  const isShort = format === 'short';
  const orientation = isShort ? 'portrait' : 'landscape';
  const fallbackOrientation = 'landscape';
  const downloaded = [];

  for (const kw of keywords) {
    if (downloaded.length >= totalClips) break;
    let videos = await searchPexels(kw, orientation, 3);
    if (!videos.length && isShort) {
      videos = await searchPexels(kw, fallbackOrientation, 3);
    }
    if (!videos.length) {
      console.warn(`Pexels: sem resultado para "${kw}" (${orientation})`);
      continue;
    }
    const fileUrl = getBestFile(videos[0], isShort);
    if (!fileUrl) continue;
    const rel = `clips/${format}/${downloaded.length}.mp4`;
    await downloadClip(fileUrl, path.join(PUB, rel));
    downloaded.push(rel);
  }

  return downloaded;
};

const run = async () => {
  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));

  if (!props.clip_keywords_longo?.length) {
    console.log('props.json sem clip_keywords — pulando busca de clipes');
    return;
  }

  const clipsLongo = await fetchClipsFor(props.clip_keywords_longo, 'long', 5);
  const clipsShort = await fetchClipsFor(props.clip_keywords_short || [], 'short', 3);

  // Registra os paths no props.json para que fetch-assets saiba a quantidade
  // (fetch-assets vai ignorar o download pois os arquivos já existem)
  const updatedProps = {
    ...props,
    audio_longo_url: props.audio_longo_url || 'local',
    audio_short_url: props.audio_short_url || 'local',
    clipes_longo: clipsLongo.map((_, i) => `clips/long/${i}.mp4`),
    clipes_short: clipsShort.map((_, i) => `clips/short/${i}.mp4`),
  };

  await fsp.writeFile(path.join(ROOT, 'props.json'), JSON.stringify(updatedProps, null, 2));
  console.log(`Clipes: ${clipsLongo.length} longo, ${clipsShort.length} short`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
