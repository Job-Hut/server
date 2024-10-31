import { ApolloServer } from "@apollo/server";
import * as user from "./schema/user.schema";
import * as jobs from "./schema/jobs.schema";
import * as collection from "./schema/collection.schema";

const server = new ApolloServer({
  typeDefs: [user.typeDefs, collection.typeDefs, jobs.typeDefs],
  resolvers: [user.resolvers, collection.resolvers, jobs.resolvers],
});

export default server;
