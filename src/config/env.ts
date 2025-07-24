import { z } from "zod";
import { Logger } from "@/utils/logger";

const logger = new Logger("Config:Env");

// Schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.string(),
  FIRECRAWL_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  PINECONE_API_KEY: z.string(),
  GOOGLE_API_KEY: z.string(),
  NEXT_PUBLIC_VAPI_PUBLIC_API_KEY: z.string(),
  NEXT_PUBLIC_VAPI_ASSISTANT_ID: z.string(),
});

// Function to validate environment variables
const validateEnv = () => {
  try {
    logger.info("Validating environment variables");
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      PINECONE_API_KEY: process.env.PINECONE_API_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      NEXT_PUBLIC_VAPI_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY,
      NEXT_PUBLIC_VAPI_ASSISTANT_ID: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
    };
    const parsed = envSchema.parse(env);
    logger.info("Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join("."));
      logger.error("Invalid environment variables", { error: { missingVars } });
      throw new Error(
        `❌ Invalid environment variables: ${missingVars.join(
          ", "
        )}. Please check your .env file`
      );
    }
    throw error;
  }
};

export const env = validateEnv();
