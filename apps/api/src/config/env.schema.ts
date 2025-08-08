import z from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  JWT_SECRET: z.string().trim(),
  JWT_EXPIRES_IN: z.string().trim().default('60s'),

  DATABASE_URL: z
    .string()
    .trim()
    .pipe(z.url({ message: 'DATABASE_URL must be a valid URL' })),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const pretty = z.prettifyError(result.error);
    throw new Error(`Invalid environment configuration\n${pretty}`);
  }
  return result.data;
}
