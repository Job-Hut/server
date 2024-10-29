import { ApolloServer } from "@apollo/server";
import * as user from "./schema/user.schema";
import * as book from "./schema/book.schema";

const server = new ApolloServer({
  typeDefs: [book.typeDefs, user.typeDefs],
  resolvers: [book.resolvers, user.resolvers],
});

export default server;
