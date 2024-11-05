import pubsub from "../config/pubsub";
import mongoose from "mongoose";
import Application from "../models/application.model";
import Collection from "../models/collection.model";
import User from "../models/user.model";

export const typeDefs = `#graphql
  scalar Date

  type Message {
    _id: ID
    senderId: User
    content: String
    createdAt: String
    updatedAt: String
  }

  type Collection {
    _id: ID!
    name: String
    description: String
    ownerId: ID!
    sharedWith: [User]
    applications: [Application]
    chat: [Message]
    createdAt: Date
    updatedAt: Date
  }

  input CollectionInput {
    name: String
    description: String
  }

  type Query {
    getAllCollection: [Collection]
    getCollectionById(id: ID!): Collection 
  }

  type Mutation {
    createCollection(
      input: CollectionInput
    ): Collection

    deleteCollection(id: ID!): Collection

    updateCollection(
      id: ID!
      input: CollectionInput
    ): Collection

    addMessageToChat(
      collectionId: ID!
      message: String
    ): Collection

    addUsersToCollection(
      collectionId: ID!
      userIds: [ID!]!
    ): Collection

    removeUsersFromCollection(
      collectionId: ID!
      userIds: [ID]!
    ): Collection

    addApplicationsToCollection(
      collectionId: ID!
      applicationIds: [ID!]!
    ): Collection

    removeApplicationFromCollection(
      collectionId: ID!
      applicationId: ID!
    ): Collection
  }

  type Subscription {
    newMessage(collectionId: ID!): Message
    collectionUserPresence(collectionId: ID!): [User]
  }
`;

export const resolvers = {
  Query: {
    getAllCollection: async (_, __, context) => {
      const user = await context.authentication();
      if (!user) throw new Error("User not found");
      return await Collection.find({
        $or: [{ ownerId: user._id }, { sharedWith: user._id }],
      })
        .populate("sharedWith")
        .populate("applications");
    },

    getCollectionById: async (_, { id }, context) => {
      const user = await context.authentication();
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Collection not found");
      }
      const collection = await Collection.findOne({
        $and: [
          { _id: id },
          { $or: [{ ownerId: user._id }, { sharedWith: user._id }] },
        ],
      })
        .populate("sharedWith")
        .populate("applications")
        .populate("chat.senderId");

      console.log(collection);
      if (!collection) {
        throw new Error(
          "Collection not found or you do not have permission to view it.",
        );
      }

      return collection;
    },
  },

  Mutation: {
    createCollection: async (_, { input }, context) => {
      const loggedUser = await context.authentication();

      const user = await User.findById(loggedUser._id);

      const newCollection = new Collection({
        ...input,
        ownerId: user._id,
      });

      await newCollection.save();

      user.collections.push(newCollection._id);

      await user.save();
      return newCollection;
    },

    deleteCollection: async (_, { id }, context) => {
      const user = await context.authentication();
      const collection = await Collection.findById(id);

      if (!collection) throw new Error("Collection not found");
      if (!collection.ownerId.equals(user._id)) {
        throw new Error("You do not have permission to delete this collection");
      }

      await Collection.findByIdAndDelete(id);
      await User.updateMany(
        { _id: { $in: collection.sharedWith } },
        { $pull: { collections: id } },
      );

      return collection;
    },

    updateCollection: async (_, { id, input }, context) => {
      const user = await context.authentication();
      const collection = await Collection.findById(id);

      if (!collection) {
        throw new Error("Collection not found");
      }
      if (!collection.ownerId.equals(user._id)) {
        throw new Error(
          "You do not have permission to update this collection.",
        );
      }

      return await Collection.findByIdAndUpdate(id, input, { new: true });
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

      await collection.populate("chat.senderId");

      pubsub.publish(`COLLECTION_NEW_MESSAGE_${collectionId}`, {
        newMessage: collection.chat[collection.chat.length - 1],
      });

      return collection;
    },

    addUsersToCollection: async (_, { collectionId, userIds }) => {
      const collection = await Collection.findById(collectionId);
      if (!collection) throw new Error("Collection not found");

      userIds.forEach((userId) => {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error("Invalid user ID");
        }
        if (collection.sharedWith.includes(userId)) {
          throw new Error("User already shared with");
        }
      });

      collection.sharedWith.push(...userIds);
      await collection.save();

      await User.updateMany(
        { _id: { $in: userIds } },
        { $push: { collections: collectionId } },
      );

      return collection;
    },

    removeUsersFromCollection: async (_, { collectionId, userIds }) => {
      const collection = await Collection.findById(collectionId);
      if (!collection) throw new Error("Collection not found");

      await Collection.findByIdAndUpdate(collectionId, {
        $pull: { sharedWith: { $in: userIds } },
      });

      await User.updateMany(
        { _id: { $in: userIds } },
        { $pull: { collections: collectionId } },
      );

      return collection;
    },

    addApplicationsToCollection: async (
      _,
      { collectionId, applicationIds },
      context,
    ) => {
      const user = await context.authentication();

      const collection = await Collection.findOne({
        _id: collectionId,
        ownerId: user._id,
      });

      if (!collection) {
        throw new Error(
          "Collection not found or you do not have permission to update it.",
        );
      }
      const applications = await Application.find({
        _id: { $in: applicationIds },
        ownerId: user._id,
      });

      if (applications.length !== applicationIds.length) {
        throw new Error(
          "One or more applications are not owned by the current user.",
        );
      }
      if (!Array.isArray(collection.applications)) {
        collection.applications = [];
      }
      collection.applications.push(...applicationIds);
      await collection.save();

      await Application.updateMany(
        { _id: { $in: applicationIds } },
        { $set: { collectionId: collectionId } },
      );

      return collection;
    },

    removeApplicationFromCollection: async (
      _,
      { collectionId, applicationId },
      context,
    ) => {
      const user = await context.authentication();

      if (!mongoose.isValidObjectId(collectionId)) {
        throw new Error("Collection not found");
      }

      const collection = await Collection.findById(collectionId);
      if (!collection) {
        throw new Error("Collection not found");
      }

      if (!collection.ownerId.equals(user._id)) {
        throw new Error(
          "You are not authorized to remove applications from this collection",
        );
      }

      collection.applications = collection.applications.filter(
        (appId) => !appId.equals(applicationId),
      );
      await collection.save();

      await Application.updateOne(
        { _id: applicationId },
        { $set: { collectionId: null } },
      );

      return collection;
    },
  },

  Subscription: {
    newMessage: {
      subscribe: async (_, { collectionId }) => {
        return pubsub.asyncIterator(`COLLECTION_NEW_MESSAGE_${collectionId}`);
      },
    },
    collectionUserPresence: {
      subscribe: async (_, { collectionId }) => {
        return pubsub.asyncIterator(`COLLECTION_USER_PRESENCE_${collectionId}`);
      },
    },
  },
};
