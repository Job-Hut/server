import { ApolloServer } from "@apollo/server";
import * as user from "./schema/user.schema";
import * as jobs from "./schema/jobs.schema";
import * as collection from "./schema/collection.schema";
import * as application from "./schema/application.schema";

const server = new ApolloServer({
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

export default server;
