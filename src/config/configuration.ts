import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),
  STORAGE_BUCKET: z.string(),
});

const env = envSchema.parse(process.env);

export const databaseConfig = registerAs('database', () => ({
  uri: env.MONGODB_URI,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
}));

export const storageConfig = registerAs('storage', () => ({
  accessKey: env.STORAGE_ACCESS_KEY,
  secretKey: env.STORAGE_SECRET_KEY,
  bucket: env.STORAGE_BUCKET,
}));
