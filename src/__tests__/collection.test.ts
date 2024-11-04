import { Express } from "express";
import request from "supertest";
import { setupTestEnvironment, teardownTestEnvironment } from "./setup";
import { signToken } from "../helpers/jwt";
import { register } from "../models/user.model";
import Collection from "../models/collection.model";

describe("Collection", () => {
  let app: Express;
  let user;
  let accessToken;
  let collection;
  let sharedWith;
  let applications;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    user = await register(
      "testuser",
      "testavatar",
      "testfullname",
      "test@mail.com",
      "Password123@",
    );

    accessToken = signToken({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    collection = new Collection({
      name: "Backend",
      description: "List of backend application",
      ownerId: user._id,
      sharedWith: [
        // "648f1e0a9b1d1e04f74e5a06",
        // "648f1e0a9b1d1e04f74e5a07"
      ],
      applications: [
        // {
        //   ownerId: user._id,
        //   collectionId: null,
        //   jobTitle: "Software Engineer",
        //   description: "Software Engineer at Google",
        //   organizationName: "Google",
        //   organizationAddress: "Mountain View, CA",
        //   organizationLogo: "https://google.com/logo.png",
        //   location: "Mountain View, CA",
        //   salary: 150000,
        //   type: "Full-time",
        //   startDate: "2022-01-01",
        //   endDate: "2022-12-31",
        //   tasks: [
        //     {
        //       title: "Task 1",
        //       description: "Task 1 description",
        //       completed: false,
        //       dueDate: "2022-01-01",
        //     },
        //   ],
        // },
      ],
      chat: [
        // {
        //   _id: "648f1e0a9b1d1e04f74e5a0d",
        //   senderId: "648f1e0a9b1d1e04f74e5a05",
        //   content: "Has anyone heard back from their interviews?",
        // },
      ],
    });

    // sharedWith = collection.sharedWith[0];
    // applications = collection.application[0];
    // chat = collection.chat[0];

    await collection.save();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it("Should not return any collection when user is not authenticate", async () => {
    const query = `
      query GetAllCollection {
        getAllCollection {
          _id
          name
          description
          ownerId
          sharedWith
          applications
          createdAt
          updatedAt
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.getAllCollection).toBeNull();
    expect(response.body.errors).toBeDefined();
  });
});
