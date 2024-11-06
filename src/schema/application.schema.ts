import Application from "../models/application.model";
import Collection from "../models/collection.model";
import User from "../models/user.model";
import model from "../services/ai/gemini";

export const typeDefs = `#graphql
  scalar Date

  type Task {
    _id: ID!
    title: String
    description: String
    completed: Boolean!
    stage: String
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
    source: String
    startDate: Date
    endDate: Date
    createdAt: Date
    updatedAt: Date
  }

  input TaskInput {
    title: String
    description: String
    stage: String
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
    source: String
    startDate: Date
    endDate: Date
  }

  type Query {
    getAllApplication: [Application]
    getSortedByPriorityApplication: [Application]
    getApplicationById(_id: ID!): Application
  }

  type Mutation {
    createApplication(input: ApplicationInput): Application
    deleteApplication(_id: ID!): Application
    updateApplication(_id: ID!, input: ApplicationInput): Application
    addTaskToApplication(applicationId: ID!, task: TaskInput): Application
    removeTaskFromApplication(applicationId: ID!, taskId: ID!): Application
    updateTaskInApplication(applicationId: ID!, taskId: ID!, task: TaskInput): Application
    getTasksGeneratedByAi(_id: ID!): [Task]
    getAdviceForApplicationByAi(_id: ID!): String
  }
`;

export const resolvers = {
  Query: {
    getAllApplication: async (_, __, context) => {
      const loggedUser = await context.authentication();

      const user = await User.findById(loggedUser._id);

      if (!user) throw new Error("User not found");

      const result = await Application.find({ ownerId: user._id });
      return result;
    },
    getSortedByPriorityApplication: async (_, __, context) => {
      const loggedUser = await context.authentication();

      const user = await User.findById(loggedUser._id);
      if (!user) throw new Error("User not found");

      const currentDate = new Date();

      const result = await Application.aggregate([
        { $match: { ownerId: user._id } },
        {
          $project: {
            _id: 1,
            ownerId: 1,
            collectionId: 1,
            jobTitle: 1,
            description: 1,
            organizationName: 1,
            organizationAddress: 1,
            organizationLogo: 1,
            location: 1,
            salary: 1,
            type: 1,
            startDate: 1,
            endDate: 1,
            createdAt: 1,
            updatedAt: 1,
            tasks: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: {
                  $and: [
                    { $eq: ["$$task.completed", false] },
                    { $gte: ["$$task.dueDate", currentDate] },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$tasks" },
        { $sort: { "tasks.dueDate": 1 } },
        { $limit: 1 },
        {
          $group: {
            _id: "$_id",
            ownerId: { $first: "$ownerId" },
            collectionId: { $first: "$collectionId" },
            jobTitle: { $first: "$jobTitle" },
            description: { $first: "$description" },
            organizationName: { $first: "$organizationName" },
            organizationAddress: { $first: "$organizationAddress" },
            organizationLogo: { $first: "$organizationLogo" },
            location: { $first: "$location" },
            salary: { $first: "$salary" },
            type: { $first: "$type" },
            startDate: { $first: "$startDate" },
            endDate: { $first: "$endDate" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            tasks: { $push: "$tasks" },
          },
        },
      ]);

      return result;
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
        ...args.input,
      });

      if (args.input.collectionId) {
        const collection = await Collection.findById(args.input.collectionId);
        if (!collection) throw new Error("Collection not found");
        collection.applications.push(newApplication._id);
        await collection.save();
      }

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

      if (input.collectionId) {
        const collection = await Collection.findById(input.collectionId);
        if (!collection) throw new Error("Collection not found");
        if (!collection.applications.includes(_id)) {
          collection.applications.push(_id);
          await collection.save();
        }
      }

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
    getTasksGeneratedByAi: async (_, { _id }, context) => {
      const user = await context.authentication();
      const application = await Application.findById(_id);

      if (!application) throw new Error("Application not found");

      delete user.password;
      const result = await model.generateContent([
        "given this user and application, generate tasks for the user to complete and prepare for the interview process from start to end",
        JSON.stringify(user),
        JSON.stringify(application),
        `
        provide result in format of  {
          title: 'the title of the task',
          description: 'the description of the task',
          dueDate: 'the due date of the task',
          createdAt: 'the date the task was created',
          updatedAt: 'the date the task was updated',
          completed: false
        }
        dueDate should be days from the currentDate where the currentDate is 
         `,
        new Date().toISOString(),
      ]);

      const content = JSON.parse(result.response.text());

      application.tasks.push(...content);
      await application.save();

      return content;
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
};
