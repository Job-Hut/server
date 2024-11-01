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

  const serverCleanup = useServer({ schema }, wsServer);

  return new ApolloServer({
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
    "/graphql",
    cors<cors.CorsRequest>(),
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
