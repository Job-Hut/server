import config from "./config";
import mongoose from "mongoose";

export const init = async () => {
  try {
    await mongoose.connect(config.mongodb.connectionString, {
      dbName: config.mongodb.database,
    });
    console.log("Connected to mongodb");
  } catch (error) {
    console.log("Can't connect to mongodb");
    console.error(error);
  }
};
