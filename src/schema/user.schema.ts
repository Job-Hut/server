import { signToken } from "../helpers/jwt";

import {
  EducationInput,
  ExperienceInput,
  LicenseInput,
  RegisterInput,
} from "../lib/types";
import User, {
  register,
  login,
  addExperience,
  addEducation,
  addLicense,
  updateExperience,
  deleteExperience,
  updateEducation,
  deleteEducation,
  updateLicense,
  deleteLicense,
} from "../models/user.model";
import { GraphQLUpload } from "graphql-upload-ts";
import { upload as uploadToCloudinary } from "../services/storage/cloudinary";

import pubsub from "../config/pubsub";
import mongoose from "mongoose";

export const typeDefs = `#graphql
  
  scalar Date
  scalar Upload

  type User {
    _id: ID!
    username: String!
    avatar: String
    fullName: String!
    email: String!
    password: String!
    profile: Profile
    collections: [Collection]
    isOnline: Int!
    createdAt: Date
    updatedAt: Date
  }

  type Profile {
    _id: ID!
    bio: String
    location: String
    jobPrefs: [String]
    experiences: [Experience]
    education: [Education]
    licenses: [License]
    createdAt: Date
    updatedAt: Date
  }

  type Experience {
    _id: ID!
    jobTitle: String!
    institute: String!
    startDate: Date!
    endDate: Date
  }

  type Education {
    _id: ID!
    name: String!
    institute: String!
    startDate: Date!
    endDate: Date
  }

  type License {
    _id: ID!
    number: String!
    name: String!
    issuedBy: String!
    issuedAt: Date!
    expiryDate: Date!
  }

  input ExperienceInput {
    jobTitle: String!
    institute: String!
    startDate: Date!
    endDate: Date
  }

  input EducationInput {
    name: String!
    institute: String!
    startDate: Date!
    endDate: Date
  }

  input LicenseInput {
    number: String!
    name: String!
    issuedBy: String!
    issuedAt: Date!
    expiryDate: Date
  }

  input RegisterInput {
    username: String!
    avatar: String
    fullName: String!
    email: String!
    password: String!
  }

  type AuthPayload {
    access_token: String!
    userId: ID!
    username: String!
    email: String!
  }
  
  type Query {
    getAllUsers(keyword: String): [User]
    getUserById(userId: String!): User
    getAuthenticatedUser: User
  }

  type Mutation {
    register(input: RegisterInput): User!
    login(email: String!, password: String!): AuthPayload!
    updateAvatar(avatar: Upload): User
    updateLocation(location: String): Profile!
    updateBio(bio: String): Profile!
    updateJobPrefs(jobPrefs: [String]): Profile!
    addExperience(input: ExperienceInput): Profile!
    updateExperience(experienceId: String!, input: ExperienceInput): Profile!
    deleteExperience(experienceId: String!): Profile!
    addEducation(input: EducationInput): Profile!
    updateEducation(educationId: String!, input: EducationInput): Profile!
    deleteEducation(educationId: String!): Profile!
    addLicense(input: LicenseInput): Profile!
    updateLicense(licenseId: String!, input: LicenseInput): Profile!
    deleteLicense(licenseId: String!): Profile!
    updateUserPresence(isOnline: Boolean!): User
  }

  type Subscription {
    userPresence: User
  }
`;

export const resolvers = {
  Upload: GraphQLUpload,
  Query: {
    getAllUsers: async (_: unknown, { keyword }) => {
      if (keyword) {
        return await User.find({
          $or: [
            { username: { $regex: keyword, $options: "i" } },
            { email: { $regex: keyword, $options: "i" } },
            { fullName: { $regex: keyword, $options: "i" } },
          ],
        });
      }
      return await User.find();
    },
    getUserById: async (_: unknown, { userId }: { userId: string }) => {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("User id is invalid");
      }
      const user = await User.findById(userId).populate("collections");
      if (!user) {
        throw new Error("No User Found");
      }
      return user;
    },
    getAuthenticatedUser: async (_: unknown, __: unknown, context) => {
      const loggedUser = await context.authentication();
      const user = await User.findById(loggedUser).populate("collections");
      if (!user) {
        throw new Error("No User Found");
      }
      return user;
    },
  },
  Mutation: {
    register: async (_, { input }: { input: RegisterInput }) => {
      try {
        const { username, avatar, fullName, email, password } = input;
        const newUser = await register(
          username,
          avatar,
          fullName,
          email,
          password,
        );
        return newUser;
      } catch (error) {
        throw new Error("Registration failed: " + error.message);
      }
    },
    login: async (
      _,
      { email, password }: { email: string; password: string },
    ) => {
      try {
        const user = await login(email, password);
        const token = signToken({
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
        });
        return {
          access_token: token,
          userId: user._id.toString(),
          username: user.username,
          email: user.email,
        };
      } catch (error) {
        throw new Error("Login failed: " + error.message);
      }
    },
    updateAvatar: async (_: unknown, { avatar }, context) => {
      try {
        const loggedUser = await context.authentication();
        const upload = await uploadToCloudinary(avatar);

        if (!upload) throw new Error("Upload Failed");

        const user = await User.findByIdAndUpdate(
          loggedUser._id,
          { avatar: upload },
          { new: true },
        );

        if (!user) throw new Error("User not found");

        return user;
      } catch (error) {
        throw new Error("Update Failed: " + error.message);
      }
    },
    updateLocation: async (
      _: unknown,
      { location }: { location: string },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        const user = await User.findByIdAndUpdate(
          loggedUser._id,
          { "profile.location": location },
          { new: true },
        );
        if (!user) throw new Error("User not found");
        return user.profile;
      } catch (error) {
        throw new Error("Update Failed: " + error.message);
      }
    },
    updateBio: async (_: unknown, { bio }: { bio: string }, context) => {
      try {
        const loggedUser = await context.authentication();
        const user = await User.findByIdAndUpdate(
          loggedUser._id,
          { "profile.bio": bio },
          { new: true },
        );
        if (!user) throw new Error("User not found");
        return user.profile;
      } catch (error) {
        throw new Error("Update Failed: " + error.message);
      }
    },
    updateJobPrefs: async (
      _: unknown,
      { jobPrefs }: { jobPrefs: string[] },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        const user = await User.findByIdAndUpdate(
          loggedUser._id,
          { "profile.jobPrefs": jobPrefs },
          { new: true }
        );
        if (!user) throw new Error("User not found");
        return user.profile;
      } catch (error) {
        throw new Error("Update Failed: " + error.message);
      }
    },    
    addExperience: async (
      _: unknown,
      { input }: { input: ExperienceInput },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await addExperience(input, loggedUser._id);
      } catch (error) {
        throw new Error("Adding Failed: " + error.message);
      }
    },
    updateExperience: async (
      _: unknown,
      { experienceId, input }: { experienceId: string; input: ExperienceInput },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await updateExperience(experienceId, input, loggedUser._id);
      } catch (error) {
        throw new Error("Update Failed: " + error.message);
      }
    },
    deleteExperience: async (
      _: unknown,
      { experienceId }: { experienceId: string },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await deleteExperience(experienceId, loggedUser._id);
      } catch (error) {
        throw new Error("Delete Failed: " + error.message);
      }
    },
    addEducation: async (
      _: unknown,
      { input }: { input: EducationInput },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await addEducation(input, loggedUser._id);
      } catch (error) {
        throw new Error("Adding Failed: " + error.message);
      }
    },
    updateEducation: async (
      _: unknown,
      { educationId, input }: { educationId: string; input: EducationInput },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await updateEducation(educationId, input, loggedUser._id);
      } catch (error) {
        throw new Error("Update Failed: " + error.message);
      }
    },
    deleteEducation: async (
      _: unknown,
      { educationId }: { educationId: string },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await deleteEducation(educationId, loggedUser._id);
      } catch (error) {
        throw new Error("Delete Failed: " + error.message);
      }
    },
    addLicense: async (
      _: unknown,
      { input }: { input: LicenseInput },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await addLicense(input, loggedUser._id);
      } catch (error) {
        throw new Error("Adding Failed: " + error.message);
      }
    },
    updateLicense: async (
      _: unknown,
      { licenseId, input }: { licenseId: string; input: LicenseInput },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await updateLicense(licenseId, input, loggedUser._id);
      } catch (error) {
        throw new Error("Update Failed: " + error.message);
      }
    },
    deleteLicense: async (
      _: unknown,
      { licenseId }: { licenseId: string },
      context,
    ) => {
      try {
        const loggedUser = await context.authentication();
        return await deleteLicense(licenseId, loggedUser._id);
      } catch (error) {
        throw new Error("Delete Failed: " + error.message);
      }
    },
    updateUserPresence: async (_: unknown, { isOnline }, context) => {
      const loggedUser = await context.authentication();

      const user = await User.findById(loggedUser._id);

      if (!user) throw new Error("User not found");

      console.log(user.username, "--", isOnline);

      if (isOnline) {
        user.isOnline += 1;
      } else {
        user.isOnline -= 1;
      }

      await user.save();

      pubsub.publish("USER_PRESENCE", { userPresence: user });

      user.collections.forEach(async (collectionId) => {
        pubsub.publish(`COLLECTION_USER_PRESENCE_${collectionId.toString()}`, {
          collectionUserPresence: user,
        });
      });

      return user;
    },
  },
  Subscription: {
    userPresence: {
      subscribe: () => pubsub.asyncIterator("USER_PRESENCE"),
    },
  },
};
