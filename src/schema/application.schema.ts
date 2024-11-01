import Application from "../models/application.model";

export const typeDefs = `#graphql
  scalar Date

  type Task {
    title: String
    description: String
    completed: Boolean
    dueDate: String
    createdAt: String
    updatedAt: String
  }

  type Application {
    ownerId: String
    collectionId: String
    jobTitle: String
    organization: String
    location: String
    salary: Int
    type: String
    # tasks: [Task]
    startDate: String
    endDate: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    getAllApplication: [Application]
  }

  type Mutation {
    createApplication(
      ownerId: String
      collectionId: ID
      jobTitle: String
      organization: String
      location: String
      salary: Int
      type: String
      # tasks: [Task]
      startDate: Date
      endDate: Date
    ): Application
  }
`;

export const resolvers = {
  Query: {
    getAllApplication: async () => {
      return await Application.find();
    },
  },

  Mutation: {
    createApplication: async (
      _,
      {
        ownerId,
        collectionId,
        jobTitle,
        organization,
        location,
        salary,
        type,
        // tasks,
        startDate,
        endDate,
      },
    ) => {
      const newApplication = new Application({
        ownerId,
        collectionId,
        jobTitle,
        organization,
        location,
        salary,
        type,
        // tasks,
        startDate,
        endDate,
      });
      return await newApplication.save();
    },
  },
};
