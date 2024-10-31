import { signToken } from "../helpers/jwt";
import User, { register, login } from "../models/user.model";

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
    register: async (_, { input }: { input: RegisterInput }) => {
      try {
        const { username, avatar, fullName, email, password } = input
        const newUser = await register(username, avatar, fullName, email, password)
        return newUser;
      } catch (error) {
        throw new Error("Registration failed: " + error.message)
      }
    },
    login: async (_, {email, password}: {email: string, password: string}) => {
       try {
          const user = await login (email, password)
          const token = signToken({
            id: user.id,
            username: user.username,
            email: user.email
          })
          return {
            access_token: token,
            userId: user._id.toString(),
            username: user.username,
            email: user.email
          }
       } catch (error) {
        throw new Error("Login failed: " + error.message)
       } 
    }
  }
}
