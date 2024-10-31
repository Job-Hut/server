import { ApolloServer } from "@apollo/server";
import * as user from "./schema/user.schema";
import * as book from "./schema/book.schema";
import * as jobs from "./schema/jobs.schema";
import * as collection from "./schema/collection.schema";

const server = new ApolloServer({
  typeDefs: [book.typeDefs, user.typeDefs, collection.typeDefs, jobs.typeDefs],
  resolvers: [book.resolvers, user.resolvers, collection.resolvers, jobs.resolvers]
});

export default server;
