import dotenv from "dotenv";
import { setupApplication } from "../server";
import mongoose from "mongoose";
import redis from "../config/redis";
import { init } from "../config/mongodb";

dotenv.config({
  path: ".env",
});

export const setupTestEnvironment = async () => {
  init();

  // Clear Redis cache
  await redis.flushall();

  // Setup application without starting HTTP server
  const { app } = await setupApplication();
  return app;
};

export const teardownTestEnvironment = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await redis.quit();
};
