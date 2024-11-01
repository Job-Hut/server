import dotenv from "dotenv";
import { setupApplication } from "../index";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import redis from "../config/redis";

let mongoServer: MongoMemoryServer;

dotenv.config({
  path: ".env.test.local",
});

export const setupTestEnvironment = async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Clear Redis cache
  await redis.flushall();

  // Setup application without starting HTTP server
  const { app } = await setupApplication({ startServer: false });
  return app;
};

export const teardownTestEnvironment = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await redis.quit();
};
