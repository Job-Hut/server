import Collection from "../models/collection.model";
import User from "../models/user.model";
import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub();

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

  type Message {
    senderId: String
    content: String
    createdAt: String
    updatedAt: String
  }

  # type Collection {
  #   _id: ID!
  #   name: String
  #   description: String
  #   public: Boolean
  #   ownerId: String
  #   sharedWith: [String]
  #   applications: [Application]
  #   threads: [Thread]
  #   chat: [Message]
  #   createdAt: Date
  #   updatedAt: Date
  # }

  type Collection {
    _id: ID!
    name: String
    description: String
    public: Boolean!
    ownerId: ID!
    sharedWith: [ID]
    applications: [ID]
    threads: [Thread]
    chat: [Message]
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
      name: String
      description: String
      public: Boolean!
    ): Collection

    deleteCollection(id: ID!): Collection

    updateCollection(
      id: ID!
      name: String
      description: String
      public: Boolean!
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
    newMessage(collectionId: ID!): Message
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
      { name, description, public: publicValue },
      context,
    ) => {
      const user = await context.authentication();

      const newCollection = new Collection({
        name,
        description,
        public: publicValue,
        ownerId: user._id,
      });

      return await newCollection.save();
    },

    deleteCollection: async (_, { id }, context) => {
      const user = await context.authentication();
      const result = await Collection.findByIdAndDelete(id);

      if (!result) throw new Error("Collection not found");

      if (!result.ownerId.equals(user._id)) {
        throw new Error("You do not have permission to delete this collection");
      }
      return result;
    },

    updateCollection: async (
      _,
      { id, name, description, public: publicValue },
      context,
    ) => {
      const user = await context.authentication();
      const collection = await Collection.findById(id);

      if (!collection) {
        throw new Error(`Collection not found.`);
      }

      if (!collection.ownerId.equals(user._id)) {
        throw new Error(
          "You do not have permission to update this collection.",
        );
      }

      const updateData = {
        ...(name && { name }),
        ...(description && { description }),
        ...(publicValue !== undefined && { public: publicValue }),
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
      pubsub.publish(`NEW_MESSAGE_${collectionId}`, {
        newMessage: collection.chat[collection.chat.length - 1],
      });
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

  Subscription: {
    newMessage: {
      subscribe: async (_, { collectionId }) => {
        return pubsub.asyncIterator(`NEW_MESSAGE_${collectionId}`);
      },
    },
  },

  // add bulk insert application [application]
};
