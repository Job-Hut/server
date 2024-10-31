import dotenv from "dotenv";

dotenv.config();

const config = {
  app: {
    host: process.env.APP_HOST || "localhost",
    port: process.env.APP_PORT || 3000,
    baseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  },
  mongodb: {
    connectionString:
      process.env.MONGODB_CONNECTION_STRING || "mongodb://localhost:27017",
    database: process.env.MONGODB_DATABASE || "test",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  }
};

export default config;
