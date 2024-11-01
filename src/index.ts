import config from "./config/config";
import mongoose from "mongoose";

import { ApolloServer } from "@apollo/server";
import * as user from "./schema/user.schema";
import * as jobs from "./schema/jobs.schema";
import * as collection from "./schema/collection.schema";
import * as application from "./schema/application.schema";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { createServer } from "http";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import express from "express";
import cors from "cors";
import { verifyToken } from "./helpers/jwt";
import User from "./models/user.model";

const app = express();
const httpServer = createServer(app);

const schema = makeExecutableSchema({
  typeDefs: [
    user.typeDefs,
    collection.typeDefs,
    jobs.typeDefs,
    application.typeDefs,
  ],
  resolvers: [
    user.resolvers,
    collection.resolvers,
    jobs.resolvers,
    application.resolvers,
  ],
});

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/subscriptions",
});

const serverCleanup = useServer({ schema }, wsServer);

export const server = new ApolloServer({
  schema,
  introspection: true,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

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
  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        return {
          authentication: async () => {
            const authorization = req.headers.authorization;
            if (!authorization) throw new Error("You have to login first!");
            const token = authorization.split(" ")[1];
            if (!token) throw new Error("Invalid Token");
            const decoded = verifyToken(token);
            const user = await User.findById(decoded._id);
            return user;
          },
        };
      },
    }),
  );
  httpServer.listen(config.app.port, () => {
    console.log(`Server is running on port ${config.app.port}`);
  });
})();
