import { z } from 'zod';

export const registerUserSchema = z.object({
  // 📧 Email
  email: z
    .string()
    .trim()
    .nonempty({ message: 'Email is required' })
    .toLowerCase()
    .pipe(z.email({ message: 'Invalid email address' })),

  // 🆔 Display name (optional)
  displayName: z
    .string()
    .trim()
    .nonempty({ message: 'Display name cannot be empty' })
    .max(32, { message: 'Display name must be at most 32 characters' })
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
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Date must be in ISO format YYYY-MM-DD',
    })
    .pipe(z.coerce.date())
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date',
    })
    .refine(
      (date) => {
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const hasHadBirthday =
          today.getMonth() > date.getMonth() ||
          (today.getMonth() === date.getMonth() &&
            today.getDate() >= date.getDate());
        if (!hasHadBirthday) age--;
        return age >= 13;
      },
      {
        message: 'You must be at least 13 years old to register',
      },
    ),
});
