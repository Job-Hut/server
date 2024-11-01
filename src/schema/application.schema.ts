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
    ownerId: ID!
    collectionId: ID
    jobTitle: String
    description: String
    organizationName: String
    organizationAddress: String
    organizationLogo: String
    location: String
    salary: Int
    type: String
    tasks: [Task]
    startDate: Date
    endDate: Date
    createdAt: Date
    updatedAt: Date
  }

  input TaskInput {
    title: String
    description: String
    completed: Boolean
    dueDate: Date
  }

  type Query {
    getAllApplication: [Application]
    getApplicationById(_id: ID!): Application
  }

  type Mutation {
    createApplication(
      ownerId: ID!
      collectionId: ID
      jobTitle: String
      description: String
      organizationName: String
      organizationAddress: String
      organizationLogo: String
      location: String
      salary: Int
      type: String
      startDate: Date
      endDate: Date
    ): Application

    deleteApplication(_id: ID!): Application

    updateApplication(
      _id: ID!
      collectionId: ID
      jobTitle: String
      description: String
      organizationName: String
      organizationAddress: String
      organizationLogo: String
      location: String
      salary: Int
      type: String
      startDate: Date
      endDate: Date
    ): Application

    addTaskToApplication(
      applicationId: ID!,
      task: TaskInput
    ): Application

    deleteTaskFromApplication(
      applicationId: ID!,
      taskId: ID!
    ): Application

    updateTaskInApplication(
      applicationId: ID!,
      taskId: ID!,
      task: TaskInput
    ): Application
  }
`;

export const resolvers = {
  Query: {
    getAllApplication: async (_, __, context) => {
      await context.authentication();
      return await Application.find();
    },
    getApplicationById: async (_, { _id }, context) => {
      await context.authentication();
      const result = await Application.findById(_id);
      if (!result) throw new Error("Application not found");
      return result;
    },
  },

  Mutation: {
    createApplication: async (_, args, context) => {
      const user = await context.authentication();

      const newApplication = new Application({
        ownerId: user._id,
        collectionId: args.collectionId || null,
        jobTitle: args.jobTitle,
        description: args.description,
        organizationName: args.organizationName,
        organizationAddress: args.organizationAddress,
        organizationLogo: args.organizationLogo,
        location: args.location,
        salary: args.salary,
        type: args.type,
        startDate: args.startDate,
        endDate: args.endDate,
      });

      return await newApplication.save();
    },

    deleteApplication: async (_, { _id }, context) => {
      await context.authentication();
      const result = await Application.findByIdAndDelete(_id);
      if (!result) throw new Error("Application not found");
      return result;
    },

    updateApplication: async (_, { _id, ...updateData }, context) => {
      const user = await context.authentication();
      updateData.ownerId = user._id;

      const result = await Application.findByIdAndUpdate(_id, updateData, {
        new: true,
      });

      if (!result) throw new Error("Application not found");
      return result;
    },

    addTaskToApplication: async (_, { applicationId, task }, context) => {
      await context.authentication();
      const application = await Application.findById(applicationId);
      if (!application) throw new Error("Application not found");

      application.tasks.push(task);
      await application.save();

      return application;
    },

    deleteTaskFromApplication: async (
      _,
      { applicationId, taskId },
      context,
    ) => {
      await context.authentication();
      const application = await Application.findById(applicationId);
      if (!application) throw new Error("Application not found");

      const task = application.tasks.id(taskId);
      task.deleteOne();
      await application.save();

      return application;
    },

    updateTaskInApplication: async (
      _,
      { applicationId, taskId, task },
      context,
    ) => {
      await context.authentication();
      const application = await Application.findById(applicationId);
      if (!application) throw new Error("Application not found");

      const updateTask = application.tasks.id(taskId);
      updateTask.set(task);
      await application.save();

      return application;
    },
  },
};
