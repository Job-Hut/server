import { ApolloServer } from "@apollo/server";
import * as user from "./schema/user.schema";
import * as book from "./schema/book.schema";
import * as collection from "./schema/collection.schema";

const server = new ApolloServer({
  typeDefs: [book.typeDefs, user.typeDefs, collection.typeDefs],
  resolvers: [book.resolvers, user.resolvers, collection.resolvers],
});

export default server;
