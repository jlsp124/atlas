import { z } from 'zod';
export const privatePhysicsSourceSchema = z.object({
  title: z.string(),
  captured: z.string(),
  status: z.enum(['partial-transcription', 'transcription', 'measured-data']),
  sections: z.array(
    z.object({
      heading: z.string(),
      text: z.string(),
      table: z
        .object({
          headers: z.array(z.string()),
          rows: z.array(z.array(z.string())),
        })
        .optional(),
      sketch: z
        .object({
          caption: z.string(),
          nodes: z.array(
            z.object({
              label: z.string(),
              x: z.number().min(0).max(600),
              y: z.number().min(0).max(360),
              pairs: z
                .array(z.enum(['top', 'right', 'bottom', 'left']))
                .optional(),
              dots: z
                .array(z.enum(['top', 'right', 'bottom', 'left']))
                .optional(),
              charge: z.string().optional(),
            }),
          ),
          edges: z
            .array(
              z.object({
                from: z.number().int().nonnegative(),
                to: z.number().int().nonnegative(),
                order: z.number().int().min(1).max(3),
                dashed: z.boolean().optional(),
              }),
            )
            .optional(),
        })
        .optional(),
      diagram: z
        .object({
          caption: z.string(),
          forces: z.array(
            z.object({
              label: z.string(),
              direction: z.enum(['up', 'down', 'left', 'right']),
              size: z.number().positive().max(2),
            }),
          ),
        })
        .optional(),
    }),
  ),
  gaps: z.array(z.string()),
  data: z
    .array(z.object({ time: z.number(), position: z.number() }))
    .optional(),
  positionUnit: z.enum(['mm', 'm']).optional(),
});
export type PrivatePhysicsSource = z.infer<typeof privatePhysicsSourceSchema>;
