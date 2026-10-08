import { z } from 'zod';
export const privatePhysicsSourceSchema = z.object({
  title: z.string(),
  captured: z.string(),
  status: z.enum(['partial-transcription', 'transcription', 'measured-data']),
  sections: z.array(z.object({ heading: z.string(), text: z.string() })),
  gaps: z.array(z.string()),
  data: z
    .array(z.object({ time: z.number(), position: z.number() }))
    .optional(),
  positionUnit: z.enum(['mm', 'm']).optional(),
});
export type PrivatePhysicsSource = z.infer<typeof privatePhysicsSourceSchema>;
