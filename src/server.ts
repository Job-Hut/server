import { ApolloServer } from "@apollo/server";
import * as user from "./schema/user.schema";
import * as book from "./schema/book.schema";
import * as jobs from "./schema/jobs.schema";

const server = new ApolloServer({
  typeDefs: [book.typeDefs, user.typeDefs, jobs.typeDefs],
  resolvers: [book.resolvers, user.resolvers, jobs.resolvers],
});

export default server;
