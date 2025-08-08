import { z } from 'zod';

export const registerUserSchema = z.strictObject({
  // 📧 Email
  email: z
    .string()
    .trim()
    .nonempty({ message: 'Email is required' })
    .toLowerCase()
    .pipe(z.email({ message: 'Invalid email address' })),

  // 🆔 Name (optional)
  name: z
    .string()
    .trim()
    .nonempty({ message: 'Name cannot be empty' })
    .max(32, { message: 'Name must be at most 32 characters' })
    .optional(),

  // 👤 Username
  username: z
    .string()
    .trim()
    .nonempty({ message: 'Username is required' })
    .toLowerCase()
    .min(2, { message: 'Username must be at least 2 characters' })
    .max(32, { message: 'Username must be at most 32 characters' })
    .regex(/^[a-z0-9_.]+$/, {
      message:
        'Username can only contain lowercase letters, numbers, underscores, and periods',
    })
    .refine((value) => !value.includes('..'), {
      message: 'Username cannot contain consecutive periods',
    }),

  // 🔑 Password
  password: z
    .string()
    .trim()
    .nonempty({ message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(72, { message: 'Password must be at most 72 characters' }),

  // 📅 Date of Birth (13+ years old)
  dateOfBirth: z
    .string()
    .trim()
    .nonempty({ message: 'Date of birth is required' })
    .superRefine((value, ctx) => {
      // Step 1: Check format
      const { success, data } = z.iso.date().safeParse(value);
      if (!success) {
        ctx.addIssue({
          code: 'custom',
          message: 'Date must be in ISO format YYYY-MM-DD',
        });
        return;
      }

      // Step 2: Parse date
      const date = new Date(data);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid date',
        });
        return;
      }

      // Step 3: Check age
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const hasHadBirthday =
        today.getMonth() > date.getMonth() ||
        (today.getMonth() === date.getMonth() &&
          today.getDate() >= date.getDate());
      if (!hasHadBirthday) age--;

      if (age < 13) {
        ctx.addIssue({
          code: 'custom',
          message: 'You must be at least 13 years old to register',
        });
      }
    })
    .transform((dateString) => new Date(dateString)),
});
