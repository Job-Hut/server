import Collection from "../models/collection.model";

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
    tasks: [Task]
    startDate: String
    endDate: String
    createdAt: String
    updatedAt: String
  }

  type Reply {
    authorId: String
    content: String
    createdAt: String
    updatedAt: String
  }

  type Thread {
    title: String
    content: String
    authorId: String
    replies: [Reply]
    createdAt: String
    updatedAt: String
  }

  type Chat {
    senderId: String
    content: String
    createdAt: String
    updatedAt: String
  }

  type Collection {
    id: ID!
    name: String
    description: String
    public: Boolean
    ownerId: String
    sharedWith: [String]
    applications: [Application]
    threads: [Thread]
    chat: [Chat]
    createdAt: Date
    updatedAt: Date
  }

  type Query {
    getAllCollection: [Collection]
    getCollectionById(id: ID!): Collection 
  }

  type Mutation {
    createCollection(
      name: String!
      description: String!
      public: Boolean!
      ownerId: String!
      sharedWith: [String]!
    ): Collection

    deleteCollection(id: ID!): Collection

    updateCollection(
      id: ID!
      name: String
      description: String
      public: Boolean
      sharedWith: [String]
    ): Collection
  }
`;

export const resolvers = {
  Query: {
    getAllCollection: async () => {
      return await Collection.find();
    },
    getCollectionById: async (_, { id }) => {
      const result = await Collection.findById(id);
      if (!result) throw new Error("Collection not found");
      return result;
    },
  },

  Mutation: {
    createCollection: async (
      _,
      {
        name,
        description,
        public: publicValue,
        ownerId,
        sharedWith,
        // applications,
        // threads,
        // chat,
      },
    ) => {
      if (typeof publicValue !== "boolean") {
        throw new Error("Public is required and must be a boolean");
      }

      const newCollection = new Collection({
        name,
        description,
        public: publicValue,
        ownerId,
        sharedWith,
        // applications: [],
        // threads: [],
        // chat: [],
      });
      return await newCollection.save();
    },

    deleteCollection: async (_, { id }) => {
      const result = await Collection.findByIdAndDelete(id);
      if (!result) throw new Error("Collection not found");
      return result;
    },

    updateCollection: async (
      _,
      {
        id,
        name,
        description,
        public: publicValue,
        sharedWith,
        // applications,
        // threads,
        // chat,
      },
    ) => {
      const exist = await Collection.findById(id);
      if (!exist) {
        throw new Error(`Collection with ID '${id}' not found.`);
      }

      const updateData = {
        ...(name && { name }),
        ...(description && { description }),
        ...(publicValue !== undefined && { public: publicValue }),
        ...(sharedWith && { sharedWith }),
        // ...(applications && { applications }),
        // ...(threads && { threads }),
        // ...(chat && { chat }),
      };

      return await Collection.findByIdAndUpdate(id, updateData, { new: true });
    },
  },
};
