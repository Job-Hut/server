import config from "./config/config";
import express from "express";
import cors from "cors";
import { createServer, Server as HttpServer } from "http";
import { WebSocketServer } from "ws";

// GraphQL imports
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { useServer } from "graphql-ws/lib/use/ws";

// Schema imports
import { typeDefs, resolvers } from "./schema";
import { createContext } from "./context";
import { init as initializeMongoDB } from "./config/mongodb";
import { GraphQLSchema } from "graphql";
import { graphqlUploadExpress } from "graphql-upload-ts";
import { verifyToken } from "./helpers/jwt";
import User from "./models/user.model";
import pubsub from "./config/pubsub";

// Separate schema configuration
export const createApolloSchema = () =>
  makeExecutableSchema({ typeDefs, resolvers });

// Separate server configuration
export const createApolloServer = (
  schema: GraphQLSchema,
  httpServer: HttpServer,
) => {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/subscriptions",
  });

  const serverCleanup = useServer(
    {
      schema,
      onConnect: async (ctx) => {
        console.log();
        console.log("----");
        console.log("Connected", new Date());
        if (ctx.connectionParams) {
          const { headers } = ctx.connectionParams as {
            headers: { authorization?: string };
          };

          if (headers) {
            const authorization = headers?.authorization;
            if (authorization) {
              const token = authorization.split(" ")[1];
              if (!token) throw new Error("Invalid Token");
              const decoded = verifyToken(token);
              const user = await User.findById(decoded._id);
              console.log(token, "<<<<", user.username);
              user.isOnline = 1;
              await user.save();

              pubsub.publish("USER_PRESENCE", { userPresence: user });

              user.collections.forEach(async (collectionId) => {
                pubsub.publish(
                  `COLLECTION_USER_PRESENCE_${collectionId.toString()}`,
                  {
                    collectionUserPresence: user,
                  },
                );
              });
            }
          }
        }
        console.log("----");
        console.log();
      },
      onDisconnect: async (ctx) => {
        console.log();
        console.log("----");
        console.log("Disconnected", new Date());
        if (ctx.connectionParams) {
          const { headers } = ctx.connectionParams as {
            headers: { authorization?: string };
          };
          if (headers) {
            const authorization = headers?.authorization;
            if (authorization) {
              const token = authorization.split(" ")[1];
              if (!token) throw new Error("Invalid Token");
              const decoded = verifyToken(token);
              const user = await User.findById(decoded._id);

              console.log(token, "<<<<", user.username);

              user.isOnline = -1;

              await user.save();

              pubsub.publish("USER_PRESENCE", { userPresence: user });

              user.collections.forEach(async (collectionId) => {
                pubsub.publish(
                  `COLLECTION_USER_PRESENCE_${collectionId.toString()}`,
                  {
                    collectionUserPresence: user,
                  },
                );
              });
            }
          }
        }
        console.log("----");
        console.log();
      },
    },
    wsServer,
  );

  return new ApolloServer({
    schema,
    introspection: true,
    csrfPrevention: true,
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
};

// Create HTTP server with Express
export const createHttpServer = () => {
  const app = express();
  const httpServer = createServer(app);
  return { app, httpServer };
};

// Main application setup
export const setupApplication = async ({ startServer = true }) => {
  const { app, httpServer } = createHttpServer();
  const schema = createApolloSchema();
  const server = createApolloServer(schema, httpServer);

  await server.start();

  app.use(
    cors<cors.CorsRequest>({
      origin: [
        "http://localhost:5173",
        "https://jobhutt.vercel.app",
        "http://localhost:8080",
      ], // Your client URL
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "apollo-require-preflight",
        "x-apollo-operation-name",
        "Authorization",
      ],
    }),
  );
  app.use(graphqlUploadExpress());

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    }),
  );

  if (startServer) {
    httpServer.listen(config.app.port, () => {
      console.log(`Server is running on port ${config.app.port}`);
    });
  }

  return { app, server, httpServer };
};

// Start the application
if (require.main === module) {
  initializeMongoDB();
  setupApplication({}).catch(console.error);
}
