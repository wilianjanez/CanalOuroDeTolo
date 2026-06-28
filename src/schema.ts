import {z} from 'zod';

export const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

export const videoSchema = z.object({
  titulo: z.string(),
  veredicto: z.enum(['OURO', 'PIRITA', 'MISTO']),
  audioSrc: z.string(), // caminho relativo em /public (ex: "audio/longo.mp3")
  clips: z.array(z.string()), // caminhos relativos em /public
  captions: z.array(captionSchema).default([]),
  audioDurationInSeconds: z.number().default(60),
  ganchoTexto: z.string().default(''), // usado no Short
});

export type VideoProps = z.infer<typeof videoSchema>;
export type Caption = z.infer<typeof captionSchema>;

export const FPS = 30;
