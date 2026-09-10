import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3334),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(8),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024), // 5MB
});

export const env = envSchema.parse(process.env);
