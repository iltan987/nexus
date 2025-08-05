import { z } from 'zod';

export const signInUserSchema = z
  .object({
    email: z
      .string()
      .trim()
      .nonempty({ message: 'Email is required' })
      .toLowerCase()
      .pipe(z.email({ message: 'Invalid email address' })),

    password: z
      .string()
      .trim()
      .nonempty({ message: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(72, { message: 'Password must be at most 72 characters' }),
  })
  .strict();
