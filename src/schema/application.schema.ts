import Application from "../models/application.model";

export const typeDefs = `#graphql
  scalar Date

  type Task {
    _id: ID!
    title: String
    description: String
    completed: Boolean
    dueDate: Date
    createdAt: Date
    updatedAt: Date
  }

  type Application {
    _id: ID!
    ownerId: String
    collectionId: String
    jobTitle: String
    organization: String
    location: String
    salary: Int
    type: String
    # tasks: [Task]
    startDate: Date
    endDate: Date
    createdAt: Date
    updatedAt: Date
  }

  type Query {
    getAllApplication: [Application]
    getApplicationById(_id: ID!): Application
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

    deleteApplication(_id: ID!): Application

    updateApplication(
      _id: ID!
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
    getAllApplication: async (_, __, context) => {
      const user = await context.authentication();
      return await Application.find();
    },
    getApplicationById: async (_, { _id }, context) => {
      const user = await context.authentication();
      const result = await Application.findById(_id);
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
        startDate,
        endDate,
      },
      context,
    ) => {
      const user = await context.authentication();

      const newApplication = new Application({
        ownerId: user._id,
        collectionId,
        jobTitle,
        organization,
        location,
        salary,
        type,
        startDate,
        endDate,
      });
      return await newApplication.save();
    },

    deleteApplication: async (_, { _id }, context) => {
      const user = await context.authentication();
      const result = await Application.findByIdAndDelete(_id);
      if (!result) throw new Error("Application not found");
      return result;
    },

    updateApplication: async (_, { _id, ...updateData }, context) => {
      const user = await context.authentication();
      const result = await Application.findByIdAndUpdate(_id, updateData, {
        new: true,
      });
      if (!result) throw new Error("Application not found");
      return result;
    },
  },
};
