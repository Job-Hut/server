import dotenv from "dotenv";

dotenv.config();

const config = {
  app: {
    host: process.env.APP_HOST || "localhost",
    port: process.env.APP_PORT || 3000,
    baseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
    secret: process.env.APP_SECRET || "secret",
  },
  mongodb: {
    connectionString:
      process.env.MONGODB_CONNECTION_STRING || "mongodb://localhost:27017",
    database: process.env.MONGODB_DATABASE || "test",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "YOUR_API_KEY",
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME",
    apiKey: process.env.CLOUDINARY_API_KEY || "YOUR_API_KEY",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "YOUR_API_SECRET",
  },
};

export default config;
