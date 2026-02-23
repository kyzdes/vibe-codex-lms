import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    S3_ENDPOINT: z.string().default("http://localhost:9000"),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET: z.string().default("vibelearn"),
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("noreply@vibelearn.ru"),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_BASE_URL: z
      .string()
      .default("https://openrouter.ai/api/v1"),
    CLOUDPAYMENTS_PUBLIC_ID: z.string().optional(),
    CLOUDPAYMENTS_API_SECRET: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
    NEXT_PUBLIC_APP_NAME: z.string().default("VibeLearn"),
    NEXT_PUBLIC_S3_URL: z.string().default("http://localhost:9000/vibelearn"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    S3_BUCKET: process.env.S3_BUCKET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
    CLOUDPAYMENTS_PUBLIC_ID: process.env.CLOUDPAYMENTS_PUBLIC_ID,
    CLOUDPAYMENTS_API_SECRET: process.env.CLOUDPAYMENTS_API_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_S3_URL: process.env.NEXT_PUBLIC_S3_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
