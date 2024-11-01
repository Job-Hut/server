import { startStandaloneServer } from "@apollo/server/standalone";
import server from "./server";
import config from "./config/config";
import mongoose from "mongoose";
import { verifyToken } from "./helpers/jwt";
import User from "./models/user.model";

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
    context: async ({ req }) => {
      return {
        authentication: async () => {
          const authorization = req.headers.authorization;
          if(!authorization) throw new Error("You have to login first!")
          const token = authorization.split(" ")[1]
          if (!token) throw new Error("Invalid Token");
          const decoded = verifyToken(token)
          const user = await User.findById(decoded._id)
          return user;
        }
      }
    }
  });
  console.log(`🚀 Server ready at: ${url}`);
})();
