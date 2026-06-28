# Ouro de Tolo — Motor de Render

Gera automaticamente o **vídeo longo (16:9, 1080p)** e o **Short (9:16, 1080×1920)** de cada pauta, a partir de áudio (ElevenLabs) + clipes de stock (Pexels) + legendas (whisper.cpp). Roda no **GitHub Actions**, disparado pelo **Make.com**.

```
Make.com  --POST dispatch-->  GitHub Actions
                                 ├─ baixa áudio + clipes
                                 ├─ whisper.cpp  -> legendas
                                 ├─ Remotion     -> longo.mp4 + short.mp4
                                 ├─ Google Drive -> sobe os 2 vídeos
                                 └─ callback ----> Make.com (Canva + YouTube)
```

## O que tem aqui

| Caminho | Função |
|---|---|
| `src/Root.tsx` | Define as 2 composições (duração = duração do áudio) |
| `src/VideoLongo.tsx` / `src/Short.tsx` | Layout de cada formato |
| `src/components/` | Stock, legendas, intro/outro, **carimbo do veredicto** |
| `scripts/fetch-assets.mjs` | Baixa áudio/clipes e prepara props locais |
| `scripts/transcribe.mjs` | Legendas com whisper.cpp |
| `scripts/render.mjs` | Renderiza os dois vídeos |
| `scripts/upload-drive.mjs` | Sobe no Google Drive |
| `scripts/notify-make.mjs` | Devolve os links pro Make |
| `.github/workflows/render.yml` | Orquestra tudo no Actions |

## Como subir (uma vez)

1. Crie um repositório **privado** no GitHub e dê push deste projeto.
2. Em **Settings → Secrets and variables → Actions**, crie os secrets:
   - `GDRIVE_SA_JSON` — JSON da conta de serviço do Google (com acesso à pasta de destino no Drive).
   - `GDRIVE_FOLDER_ID` — ID da pasta do Drive onde os vídeos serão salvos.
   - `MAKE_CALLBACK_URL` — URL do webhook do Make que retoma o fluxo.
3. Pronto. O Actions já reage ao disparo do Make.

## Como o Make dispara isto

O Make faz um **HTTP POST** para:

```
POST https://api.github.com/repos/<owner>/<repo>/dispatches
Authorization: Bearer <PAT do GitHub com escopo repo>
Accept: application/vnd.github+json

{
  "event_type": "render",
  "client_payload": { ...veja props.example.json... }
}
```

O `client_payload` é o **contrato de dados** entre Make e este motor (campos em `props.example.json`):
`row_id`, `titulo_longo`, `titulo_short`, `veredicto` (`OURO`/`PIRITA`/`MISTO`), `gancho_short`, `audio_longo_url`, `audio_short_url`, `clipes_longo[]`, `clipes_short[]`.

Quando termina, o motor faz POST no `MAKE_CALLBACK_URL` com:
```json
{ "row_id": "12", "longo": {"id","link","download"}, "short": {...}, "status": "rendered" }
```

## Rodar local (teste)

```bash
npm install
cp props.example.json props.json   # edite com URLs reais de áudio/clipes
npm run pipeline                    # fetch -> transcribe -> render -> upload -> notify
# ou só ver no editor:
npm run studio
```

Requisitos locais: Node 18+ e ffmpeg instalado.

## Notas

- **Legendas**: `WHISPER_MODEL=small` por padrão (rápido). Para PT mais preciso use `medium` (mais lento — pesa no tempo do Actions).
- **Tempo de Actions**: ~8–12 min por execução. Plano free = 2.000 min/mês, folga confortável para 32 vídeos.
- **Duração**: cada vídeo acompanha automaticamente a duração do MP3 da narração.
- **Verificar números**: roteiros com juros/percentuais devem ser conferidos antes de publicar — o motor renderiza o que recebe.
