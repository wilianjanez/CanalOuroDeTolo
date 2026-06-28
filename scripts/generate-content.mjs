// Gera roteiro, títulos, gancho e keywords de clipes usando Claude.
// Lê props.json (precisa de "tema" e "veredicto"), escreve de volta com os campos gerados.
import Anthropic from '@anthropic-ai/sdk';
import fsp from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const run = async () => {
  const props = JSON.parse(await fsp.readFile(path.join(ROOT, 'props.json'), 'utf8'));

  if (!props.tema) {
    console.log('props.json sem "tema" — pulando geração de conteúdo');
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY');

  const client = new Anthropic({apiKey});
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
  const veredicto = props.veredicto || 'MISTO';

  const prompt = `Você é roteirista sênior do canal "Ouro de Tolo" — educação financeira para brasileiros.
O canal analisa produtos e estratégias com veredictos: OURO (recomendado), PIRITA (evite), MISTO (depende).

TEMA: ${props.tema}
VEREDICTO: ${veredicto}

Retorne APENAS um objeto JSON válido, sem markdown, com estes campos:

{
  "titulo_longo": "título do vídeo longo para YouTube (máx 70 chars, sem clickbait exagerado)",
  "titulo_short": "título do Short (máx 50 chars, termina com #shorts)",
  "gancho_short": "pergunta impactante que abre o Short (máx 65 chars, primeira pessoa do espectador)",
  "descricao_youtube_longo": "descrição do vídeo longo (2-3 parágrafos, inclui CTA para inscrição, hashtags ao final)",
  "descricao_youtube_short": "descrição do Short (1 parágrafo curto + hashtags #shorts #financas)",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8"],
  "roteiro_longo": "roteiro completo da narração, ~3-4 minutos de fala (450-600 palavras). Tom direto, educativo, coloquial PT-BR. NÃO inclua saudação inicial nem encerramento do canal — esses são inseridos automaticamente. Inclua dados reais, compare com alternativas e conclua com o veredicto ${veredicto}.",
  "roteiro_short": "narração do Short, ~40-50 segundos (80-110 palavras). Começa respondendo o gancho, explica o ponto central em 2-3 frases, conclui com o veredicto ${veredicto}. PT-BR coloquial.",
  "clip_keywords_longo": ["kw_ingles_1","kw_ingles_2","kw_ingles_3","kw_ingles_4","kw_ingles_5"],
  "clip_keywords_short": ["kw_ingles_1","kw_ingles_2","kw_ingles_3"]
}

Regras de clip_keywords: em inglês, concretos (ex: "money coins", "bank building", "investment chart"). Evite palavras abstratas.`;

  console.log(`Gerando conteúdo para: "${props.tema}" [${model}]...`);
  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{role: 'user', content: prompt}],
  });

  const text = message.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Claude não retornou JSON válido:\n${text}`);

  const content = JSON.parse(jsonMatch[0]);

  const updatedProps = {
    ...props,
    titulo_longo: content.titulo_longo,
    titulo_short: content.titulo_short,
    gancho_short: content.gancho_short,
    descricao_youtube_longo: content.descricao_youtube_longo,
    descricao_youtube_short: content.descricao_youtube_short,
    tags: content.tags,
    roteiro_longo: content.roteiro_longo,
    roteiro_short: content.roteiro_short,
    clip_keywords_longo: content.clip_keywords_longo,
    clip_keywords_short: content.clip_keywords_short,
  };

  await fsp.mkdir(path.join(ROOT, 'build'), {recursive: true});
  await fsp.writeFile(path.join(ROOT, 'props.json'), JSON.stringify(updatedProps, null, 2));
  console.log('Conteúdo gerado:', content.titulo_longo);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
