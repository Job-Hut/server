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
    id: ID!
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
    getApplicationById(id: ID!): Application
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
    getApplicationById: async (_, { id }) => {
      const result = await Application.findById(id);
      if (!result) throw new Error("Application not found");
      return result;
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
