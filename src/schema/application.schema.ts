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

    deleteApplication(_id: ID!): Application

    updateApplication(
      id: ID!
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

    deleteApplication: async (_, { id }) => {
      const result = await Application.findByIdAndDelete(id);
      if (!result) throw new Error("Application not found");
      return result;
    },

    updateApplication: async (_, { id, ...updateData }) => {
      const result = await Application.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!result) throw new Error(`Application with id ${id} not found.`);
      return result;
    },
  },
};
