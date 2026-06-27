import "dotenv/config";
import { z } from "zod";

// Define validation schema for environment variables
// This ensures all required variables are present and correctly typed before the server starts
const envSchema = z.object({
  PORT: z.string().default("3000"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters for security"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_FROM_NAME: z.string().default("Family Chat"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  ARCJET_KEY: z.string().optional(),
  ARCJET_ENV: z.enum(["development", "production"]).default("development"),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
});

// Validate environment variables against the schema
// This will throw a detailed error if any required variables are missing or invalid
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1); // Exit immediately if env vars are invalid
}

// Export validated and typed environment variables
export const ENV = {
  PORT: parsedEnv.data.PORT,
  MONGO_URI: parsedEnv.data.MONGO_URI,
  JWT_SECRET: parsedEnv.data.JWT_SECRET,
  NODE_ENV: parsedEnv.data.NODE_ENV,
  CLIENT_URL: parsedEnv.data.CLIENT_URL.split(",").map((s) => s.trim()),
  SMTP_HOST: parsedEnv.data.SMTP_HOST,
  SMTP_PORT: parseInt(parsedEnv.data.SMTP_PORT),
  SMTP_USER: parsedEnv.data.SMTP_USER,
  SMTP_PASS: parsedEnv.data.SMTP_PASS,
  EMAIL_FROM: parsedEnv.data.EMAIL_FROM,
  EMAIL_FROM_NAME: parsedEnv.data.EMAIL_FROM_NAME,
  CLOUDINARY_CLOUD_NAME: parsedEnv.data.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: parsedEnv.data.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: parsedEnv.data.CLOUDINARY_API_SECRET,
  ARCJET_KEY: parsedEnv.data.ARCJET_KEY,
  ARCJET_ENV: parsedEnv.data.ARCJET_ENV,
  VAPID_PUBLIC_KEY: parsedEnv.data.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: parsedEnv.data.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: parsedEnv.data.VAPID_SUBJECT,
};
