import config from "./config";
import mongoose from "mongoose";

export const init = async () => {
  // console.log(config, "<<< mongodb.ts");
  await mongoose.connect(config.mongodb.connectionString, {
    dbName: config.mongodb.database,
  });
};
