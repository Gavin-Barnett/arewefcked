import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default(""),
  NEWSAPI_KEY: z.string().default(""),
  ACLED_API_KEY: z.string().default(""),
  ACLED_EMAIL: z.string().default(""),
  FRED_API_KEY: z.string().default(""),
  CRON_SECRET: z.string().default(""),
  RELIEFWEB_APPNAME: z.string().default("are-we-fcked/0.1")
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEWSAPI_KEY: process.env.NEWSAPI_KEY,
  ACLED_API_KEY: process.env.ACLED_API_KEY,
  ACLED_EMAIL: process.env.ACLED_EMAIL,
  FRED_API_KEY: process.env.FRED_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  RELIEFWEB_APPNAME: process.env.RELIEFWEB_APPNAME
});