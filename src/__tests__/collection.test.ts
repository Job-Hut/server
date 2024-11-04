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

  it("Should create a new collection for authenticated user", async () => {
    const query = `
      mutation CreateCollection($input: CollectionInput) {
        createCollection(input: $input) {
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

    const variables = {
      input: {
        name: "Backend",
        description: "List of backend applications",
      },
    };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.data.createCollection).toBeDefined();
    expect(response.body.data.createCollection.name).toBe("Backend");
    expect(response.body.data.createCollection.description).toBe(
      "List of backend applications",
    );
    expect(response.body.data.createCollection.ownerId).toBe(
      user._id.toString(),
    );
  });

  it("Should get collection by ID when user is authenticated and collection ID is correct", async () => {
    const query = `
      query GetCollectionById($id: ID!) {
        getCollectionById(id: $id) {
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

    const variables = { id: collection._id.toString() };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.data.getCollectionById).toBeDefined();
    expect(response.body.data.getCollectionById._id).toBe(
      collection._id.toString(),
    );
    expect(response.body.data.getCollectionById.name).toBe("Backend");
  });

  it("Should return an error when collection ID is invalid", async () => {
    const query = `
      query GetCollectionById($getCollectionByIdId: ID!) {
        getCollectionById(id: $getCollectionByIdId) {
          name
        }
      }
    `;

    const variables = { getCollectionByIdId: "invalid_id" };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe("Collection not found");
  });
});
