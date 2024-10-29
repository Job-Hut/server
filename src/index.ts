import { startStandaloneServer } from "@apollo/server/standalone";
import server from "./server";
import config from "./config/config";
import mongoose from "mongoose";

(async () => {
  mongoose
    .connect(config.mongodb.connectionString, {
      dbName: config.mongodb.database,
    })
    .then(() => {
      console.log("connected to mongodb");
    })
    .catch((err) => {
      console.error(err);
    });
  const { url } = await startStandaloneServer(server, {
    listen: { port: +config.app.port },
  });
  console.log(`🚀 Server ready at: ${url}`);
})();
