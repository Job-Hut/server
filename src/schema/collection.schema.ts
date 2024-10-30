import Collection from "../models/collection.model";

export const typeDefs = `#graphql
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
    name: String
    description: String
    public: Boolean
    ownerId: String
    sharedWith: [String]
    applications: [Application]
    threads: [Thread]
    chat: [Chat]
    createdAt: String
    updatedAt: String
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
      # applications: [Application]
      # threads: [Thread]
      # chat: [Chat]
    ): Collection

    deleteCollection(id: ID!): Collection
  }
`;

export const resolvers = {
  Query: {
    getAllCollection: async () => {
      return await Collection.find();
    },
    getCollectionById: async (_, { id }) => {
      return await Collection.findById(id);
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
      const newCollection = new Collection({
        name,
        description,
        public: publicValue,
        ownerId,
        sharedWith,
        applications: [],
        threads: [],
        chat: [],
      });
      return await newCollection.save();
    },

    deleteCollection: async (_, { id }) => {
      const deletedCollection = await Collection.findByIdAndDelete(id);
      return deletedCollection;
    },
  },
};
