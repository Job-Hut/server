import User, { register } from "../models/user.model";

export const typeDefs = `#graphql
  
  scalar Date

  type User {
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
    location: String
    experiences: [Experience]
    education: [Education]
    licenses: [License]
    createdAt: Date
    updatedAt: Date
  }

  type Experience {
    jobTitle: String!
    institute: String!
    startDate: Date!
    endDate: Date
  }

  type Education {
    name: String!
    institute: String!
    startDate: String!
    endDate: Date
  }

  type License {
    number: String!
    name: String!
    issuedBy: String!
    issuedAt: Date!
    expiryDate: Date!
  }

  input RegisterInput {
    username: String!
    avatar: String
    fullName: String!
    email: String!
    password: String!
  }
  
  type Query {
    users: [User]
  }

  type Mutation {
    register(input: RegisterInput): User!
  }

`;

type RegisterInput = {
  username: string
  avatar: string
  fullName: string
  email: string
  password: string
}

export const resolvers = {
  Query: {
    users: async () => {
      return await User.find();
    },
  },
  Mutation: {
    register: async (_, { input }: {input: RegisterInput}) => {
      try {
        const {username, avatar, fullName, email, password} = input
        const newUser = await register(username, avatar, fullName, email, password)
        return newUser;
      } catch (error) {
        throw new Error("Registration failed: " + error.message)
      }
    }
  }
}
