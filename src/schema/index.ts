import {
  resolvers as collectionResolvers,
  typeDefs as collectionTypeDefs,
} from "./collection.schema";
import {
  resolvers as userResolvers,
  typeDefs as userTypeDefs,
} from "./user.schema";
import {
  resolvers as jobsResolvers,
  typeDefs as jobsTypeDefs,
} from "./jobs.schema";
import {
  resolvers as applicationResolvers,
  typeDefs as applicationTypeDefs,
} from "./application.schema";

export const typeDefs = [
  collectionTypeDefs,
  userTypeDefs,
  jobsTypeDefs,
  applicationTypeDefs,
];

export const resolvers = {
  ...collectionResolvers,
  ...userResolvers,
  ...jobsResolvers,
  ...applicationResolvers,
};
