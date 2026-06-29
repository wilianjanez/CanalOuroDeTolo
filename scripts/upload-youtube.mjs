// Publica longo.mp4 e short.mp4 no YouTube via YouTube Data API v3 (OAuth2).
// Requer secrets: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {google} from 'googleapis';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'out');
const BUILD = path.join(ROOT, 'build');

const uploadVideo = async (youtube, file, title, description, tags, isShort, thumbnailFile) => {
  const filePath = path.join(OUT, file);
  const stat = await fsp.stat(filePath);
  console.log(`Subindo ${file} (${(stat.size / 1024 / 1024).toFixed(1)} MB) para o YouTube...`);

  const allTags = isShort ? [...(tags || []), 'shorts', 'short'] : (tags || []);
  const fullDescription = isShort
    ? description + '\n\n#Shorts'
    : description;

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description: fullDescription,
        tags: allTags,
        categoryId: '27', // Education
        defaultLanguage: 'pt',
        defaultAudioLanguage: 'pt',
      },
      status: {
        privacyStatus: process.env.YOUTUBE_PRIVACY || 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType: 'video/mp4',
      body: fs.createReadStream(filePath),
    },
  });

  const id = res.data.id;
  const url = `https://www.youtube.com/watch?v=${id}`;
  console.log(`OK: ${url}`);

  // Sobe thumbnail se o arquivo existir
  if (thumbnailFile) {
    const thumbPath = path.join(OUT, thumbnailFile);
    const thumbExists = await fsp.access(thumbPath).then(() => true).catch(() => false);
    if (thumbExists) {
      try {
        await youtube.thumbnails.set({
          videoId: id,
          media: {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(thumbPath),
          },
        });
        console.log(`Thumbnail definida: ${thumbnailFile}`);
      } catch (e) {
        // Canal não verificado ou quota — não trava o pipeline
        console.warn(`Aviso: thumbnail não pôde ser definida: ${e?.errors?.[0]?.reason || e.message}`);
      }
    }
  }

  return {id, url};
};

const run = async () => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log('Secrets do YouTube não configurados (YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN) — pulando upload');
    return;
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');
  auth.setCredentials({refresh_token: refreshToken});

  const youtube = google.youtube({version: 'v3', auth});
  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));

  const longoResult = await uploadVideo(
    youtube,
    'longo.mp4',
    props.titulo_longo || props.row_id,
    props.descricao_youtube_longo || '',
    props.tags || [],
    false,
    'thumbnail_longo.jpg',
  );

  const shortResult = await uploadVideo(
    youtube,
    'short.mp4',
    props.titulo_short || `${props.row_id} #shorts`,
    props.descricao_youtube_short || '',
    props.tags || [],
    true,
    'thumbnail_short.jpg',
  );

  const result = {row_id: props.row_id, longo: longoResult, short: shortResult};
  await fsp.mkdir(BUILD, {recursive: true});
  await fsp.writeFile(path.join(BUILD, 'youtube-result.json'), JSON.stringify(result, null, 2));
};

run().catch((e) => {
  // Exibe o motivo exato da API do YouTube (ex: youtubeSignupRequired, forbidden…)
  if (e?.errors?.length) {
    console.error('YouTube API error:');
    for (const err of e.errors) {
      console.error(`  reason: ${err.reason}  message: ${err.message}  domain: ${err.domain}`);
    }
    console.error(`  status: ${e.code ?? e.status}`);
  } else {
    console.error(e);
  }
  process.exit(1);
});
