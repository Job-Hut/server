import { signToken } from "../helpers/jwt";
import User, { register, login, addExperience } from "../models/user.model";

export const typeDefs = `#graphql
  
  scalar Date

  type User {
    _id: String!
    username: String!
    avatar: String
    fullName: String!
    email: String!
    password: String!
    profile: Profile
    createdAt: Date
    updatedAt: Date
  }

  type Profile {
    _id: String!
    bio: String
    location: String
    experiences: [Experience]
    education: [Education]
    licenses: [License]
    createdAt: Date
    updatedAt: Date
  }

  type Experience {
    _id: String!
    jobTitle: String!
    institute: String!
    startDate: Date!
    endDate: Date
  }

  type Education {
    _id: String!
    name: String!
    institute: String!
    startDate: String!
    endDate: Date
  }

  type License {
    _id: String!
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
    users: [User]
  }

  type Mutation {
    register(input: RegisterInput): User!
    login(email: String!, password: String!): AuthPayload!
    updateLocation(location: String): Profile!
    updateBio(bio: String): Profile!
    addExperience(input: ExperienceInput): Profile!
    updateExperience(experienceId: String!, input: ExperienceInput): Profile!
    deleteExperience(experienceId: String!): Profile!
    addEducation(input: EducationInput): Profile!
    updateEducation(educationId: String!, input: EducationInput): Profile!
    deleteEducation(educationId: String!): Profile!
    addLicense(input: LicenseInput): Profile!
    updateLicense(licenseId: String!, input: LicenseInput): Profile!
    deleteLicense(licenseId: String!): Profile!
  }

`;

type RegisterInput = {
  username: string;
  avatar: string;
  fullName: string;
  email: string;
  password: string;
};

type ExperienceInput = {
  jobTitle: string
  institute: string
  startDate: Date
  endDate: Date
}

// type EditProfileInput = {
//   location?: string;
//   experiences?: {
//     jobTitle: string;
//     institute: string;
//     startDate: Date;
//     endDate?: Date;
//   }[];
//   education?: {
//     name: string;
//     institute: string;
//     startDate: Date;
//     endDate?: Date;
//   }[];
//   licenses?: {
//     number: string;
//     name: string;
//     issuedBy: string;
//     issuedAt: Date;
//     expiryDate?: Date;
//   }[];
// };

export const resolvers = {
  Query: {
    users: async () => {
      return await User.find();
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
    updateLocation: async (_: unknown, { location }: { location: string }, context) => {
      const loggedUser = await context.authentication();
      const user = await User.findByIdAndUpdate(loggedUser._id, { "profile.location": location }, { new: true });
      if (!user) throw new Error("User not found");
      return user.profile;
    },
    updateBio: async (_: unknown, { bio}: { bio: string; userId: string }, context) => {
      const loggedUser = await context.authentication();
      const user = await User.findByIdAndUpdate(loggedUser._id, { "profile.bio": bio }, { new: true });
      if (!user) throw new Error("User not found");
      return user.profile;
    },
    addExperience: async (_: unknown, { input }: { input: ExperienceInput }, context) => {
      const loggedUser = await context.authentication();
      return await addExperience(input, loggedUser._id);
    },
  },
};
