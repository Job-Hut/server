import Application from "../models/application.model";
import model from "../services/ai/gemini";

export const typeDefs = `#graphql
  scalar Date

  type Task {
    _id: ID!
    title: String
    description: String
    completed: Boolean!
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

  input ApplicationInput {
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
  }

  type Query {
    getAllApplication: [Application]
    getApplicationById(_id: ID!): Application
    getTasksGeneratedByAi(_id: ID!): [Task]
    getAdviceForApplicationByAi(_id: ID!): String
  }

  type Mutation {
    createApplication(input: ApplicationInput): Application
    deleteApplication(_id: ID!): Application
    updateApplication(_id: ID!, input: ApplicationInput): Application
    addTaskToApplication(applicationId: ID!, task: TaskInput): Application
    removeTaskFromApplication(applicationId: ID!, taskId: ID!): Application
    updateTaskInApplication(applicationId: ID!, taskId: ID!, task: TaskInput): Application
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
    getTasksGeneratedByAi: async (_, { _id }, context) => {
      const user = await context.authentication();
      const application = await Application.findById(_id);

      if (!application) throw new Error("Application not found");

      delete user.password;
      const result = await model.generateContent([
        "generate tasks the user must take in order to complete the application",
        JSON.stringify(user),
        JSON.stringify(application),
        "provide result in json format for easy parsing where each task contain title, description, due date, and completion status false by default starting from the current date, where the current date is ",
        new Date().toISOString(),
      ]);
      const content = JSON.parse(result.response.text());
      return content.tasks;
    },

    getAdviceForApplicationByAi: async (_, { _id }, context) => {
      const user = await context.authentication();
      const application = await Application.findById(_id);

      if (!application) throw new Error("Application not found");

      delete user.password;

      const result = await model.generateContent([
        "provide advice for the user to improve their application",
        JSON.stringify(user),
        JSON.stringify(application),
        "provide result in long text format contain the advice for the user in format of { advice: 'the advice for the user' }",
        "don't forget to provide the advice in a friendly and helpful manner",
        "don't mention any negative feedback, only provide positive feedback",
        "don't mention the json input format in the advice, rather mention the user and application details",
      ]);
      const content = JSON.parse(result.response.text());
      return content.advice;
    },
  },

  Mutation: {
    createApplication: async (_, args, context) => {
      const user = await context.authentication();

      const newApplication = new Application({
        ownerId: user._id,
        ...args.input,
      });

      return await newApplication.save();
    },

    deleteApplication: async (_, { _id }, context) => {
      await context.authentication();
      const result = await Application.findByIdAndDelete(_id);
      if (!result) throw new Error("Application not found");
      return result;
    },

    updateApplication: async (_, { _id, input }, context) => {
      await context.authentication();

      const result = await Application.findByIdAndUpdate(_id, input, {
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

    removeTaskFromApplication: async (
      _,
      { applicationId, taskId },
      context,
    ) => {
      await context.authentication();
      const application = await Application.findById(applicationId);
      if (!application) throw new Error("Application not found");

      const task = application.tasks.id(taskId);
      if (!task) {
        throw new Error("Task not found");
      }
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
