import Collection from "../models/collection.model";
import User from "../models/user.model";

export const typeDefs = `#graphql
  scalar Date

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
    _id: ID!
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

  input ThreadInput {
    title: String
    content: String
    authorId: String
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

    updateCollection(
      id: ID!
      name: String
      description: String
      public: Boolean
      sharedWith: [String]
      # applications: [ApplicationInput]
      # threads: [ThreadInput]
      # chat: [ChatInput]
    ): Collection

    addMessageToChat(
      collectionId: ID!
      message: String
    ): Collection

    addUserToCollection(
      collectionId: ID!
      userId: ID!
    ): Collection

     }

  type Subscription {
    newMessage(collectionId: ID!): Chat
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
      { name, description, public: publicValue, ownerId },
    ) => {
      if (typeof publicValue !== "boolean") {
        throw new Error("Public is required and must be a boolean");
      }

      const newCollection = new Collection({
        name,
        description,
        public: publicValue,
        ownerId,
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

    addMessageToChat: async (_, { collectionId, message }, context) => {
      const loggedUser = await context.authentication();
      const collection = await Collection.findById(collectionId);
      if (!collection) throw new Error("Collection not found");
      collection.chat.push({
        senderId: loggedUser._id,
        content: message,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await collection.save();
      return collection;
    },

    addUserToCollection: async (_, { collectionId, userId }) => {
      const collection = await Collection.findById(collectionId);
      if (!collection) throw new Error("Collection not found");
      collection.sharedWith.push(userId);
      await collection.save();
      await User.findByIdAndUpdate(userId, {
        $push: { collections: collectionId },
      });
      return collection;
    },
  },

  // add bulk insert application [application]
};
