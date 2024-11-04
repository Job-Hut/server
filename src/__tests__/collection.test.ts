import { Express } from "express";
import request from "supertest";
import { setupTestEnvironment, teardownTestEnvironment } from "./setup";
import { signToken } from "../helpers/jwt";
import { register } from "../models/user.model";
import Collection from "../models/collection.model";
import Application from "../models/application.model";
import mongoose from "mongoose";

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

  it("Should retrieve the collection by ID when the user is authenticated and the collection ID is valid", async () => {
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

  it("Should return an error when user tries to view a collection that is not theirs", async () => {
    const anotherUser = await register(
      "user1",
      "avatar1",
      "fullname1",
      "user1@mail.com",
      "Password123@",
    );

    const anotherCollection = new Collection({
      name: "Another Collection",
      description: "This collection belongs to another user.",
      ownerId: anotherUser._id,
      sharedWith: [],
      applications: [],
      chat: [],
    });
    await anotherCollection.save();

    const query = `
      query GetCollectionById($getCollectionByIdId: ID!) {
        getCollectionById(id: $getCollectionByIdId) {
          name
          description
        }
      }
    `;

    const variables = { getCollectionByIdId: anotherCollection._id.toString() };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Collection not found or you do not have permission to view it.",
    );
  });

  it("Should delete a collection when the user is the owner", async () => {
    const collectionToDelete = new Collection({
      name: "Collection to Delete",
      description: "This collection will be deleted.",
      ownerId: user._id,
      sharedWith: [],
      applications: [],
      chat: [],
    });
    await collectionToDelete.save();

    const query = `
      mutation DeleteCollection($id: ID!) {
        deleteCollection(id: $id) {
          _id
          name
        }
      }
    `;

    const variables = { id: collectionToDelete._id.toString() };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.data.deleteCollection).toBeDefined();
    expect(response.body.data.deleteCollection._id).toBe(
      collectionToDelete._id.toString(),
    );

    const deletedCollection = await Collection.findById(collectionToDelete._id);
    expect(deletedCollection).toBeNull();
  });

  it("Should return an error when user tries to delete a collection they do not own", async () => {
    const anotherUser = await register(
      "user2",
      "avatar2",
      "fullname2",
      "user2@mail.com",
      "Password123@",
    );

    const collectionNotOwned = new Collection({
      name: "Collection Not Owned",
      description: "This collection does not belong to the user.",
      ownerId: anotherUser._id,
      sharedWith: [],
      applications: [],
      chat: [],
    });
    await collectionNotOwned.save();

    const query = `
      mutation DeleteCollection($id: ID!) {
        deleteCollection(id: $id) {
          _id
        }
      }
    `;

    const variables = { id: collectionNotOwned._id.toString() };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "You do not have permission to delete this collection",
    );
  });

  it("Should return an error when trying to delete a collection that does not exist", async () => {
    const query = `
      mutation DeleteCollection($id: ID!) {
        deleteCollection(id: $id) {
          _id
        }
      }
    `;

    const variables = { id: "60e5f9b2c1f1e1a4e8c8f3d2" };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe("Collection not found");
  });

  it("Should update a collection successfully when user is the owner", async () => {
    const query = `
      mutation UpdateCollection($id: ID!, $input: CollectionInput) {
        updateCollection(id: $id, input: $input) {
          _id
          name
          description
        }
      }
    `;

    const variables = {
      // id: collectionToUpdate._id.toString(),
      id: collection._id.toString(),
      input: {
        name: "Updated Collection",
        description: "This is an updated collection.",
      },
    };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.data.updateCollection).toBeDefined();
    expect(response.body.data.updateCollection.name).toBe("Updated Collection");
    expect(response.body.data.updateCollection.description).toBe(
      "This is an updated collection.",
    );

    const updatedCollection = await Collection.findById(collection._id);
    expect(updatedCollection.name).toBe("Updated Collection");
    expect(updatedCollection.description).toBe(
      "This is an updated collection.",
    );
  });

  it("Should return an error when trying to update a non-existent collection", async () => {
    const query = `
      mutation UpdateCollection($id: ID!, $input: CollectionInput!) {
        updateCollection(id: $id, input: $input) {
          name
          description
        }
      }
    `;

    const variables = {
      id: "60e5f9b2c1f1e1a4e8c8f3d2",
      input: {
        name: "Attempted Update",
        description: "This update should fail.",
      },
    };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe("Collection not found");
  });

  it("Should return an error when user tries to update a collection they do not own", async () => {
    const anotherUser = await register(
      "user3",
      "avatar3",
      "fullname3",
      "user3@mail.com",
      "Password123@",
    );

    const collectionNotOwned = new Collection({
      name: "Collection Not Owned",
      description: "This collection does not belong to the user.",
      ownerId: anotherUser._id,
      sharedWith: [],
      applications: [],
      chat: [],
    });
    await collectionNotOwned.save();

    const query = `
      mutation UpdateCollection($id: ID!, $input: CollectionInput) {
        updateCollection(id: $id, input: $input) {
          _id
          name
        }
      }
    `;

    const variables = {
      id: collectionNotOwned._id.toString(),
      input: {
        name: "Unauthorized Update",
        description: "This update should not be allowed.",
      },
    };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "You do not have permission to update this collection.",
    );
  });

  it("Should add applications to a collection successfully when the user is the owner", async () => {
    const collection = new Collection({
      name: "My Collection",
      description: "This is my collection.",
      ownerId: user._id,
      applications: [],
    });
    await collection.save();

    const application1 = new Application({
      jobTitle: "Dev",
      ownerId: user._id,
    });
    const application2 = new Application({
      jobTitle: "Tester",
      ownerId: user._id,
    });
    await application1.save();
    await application2.save();

    const query = `
      mutation AddApplicationsToCollection($collectionId: ID!, $applicationIds: [ID!]!) {
        addApplicationsToCollection(collectionId: $collectionId, applicationIds: $applicationIds) {
          _id
          applications
        }
      }
    `;

    const variables = {
      collectionId: collection._id.toString(),
      applicationIds: [
        application1._id.toString(),
        application2._id.toString(),
      ],
    };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.data.addApplicationsToCollection).toBeDefined();
    expect(response.body.data.addApplicationsToCollection.applications).toEqual(
      expect.arrayContaining([
        application1._id.toString(),
        application2._id.toString(),
      ]),
    );
  });

  it("Should return an error when trying to add applications to a collection the user does not own", async () => {
    const anotherUser = await register(
      "user4",
      "avatar4",
      "fullname4",
      "user4@mail.com",
      "Password123@",
    );

    const collectionNotOwned = new Collection({
      name: "Collection Not Owned",
      description: "This collection does not belong to the user.",
      ownerId: anotherUser._id,
      applications: [],
    });
    await collectionNotOwned.save();

    const application1 = new Application({
      jobTitle: "Dev",
      ownerId: user._id,
    });
    await application1.save();

    const query = `
      mutation AddApplicationsToCollection($collectionId: ID!, $applicationIds: [ID!]!) {
        addApplicationsToCollection(collectionId: $collectionId, applicationIds: $applicationIds) {
          _id
          applications
        }
      }
    `;

    const variables = {
      collectionId: collectionNotOwned._id.toString(),
      applicationIds: [application1._id.toString()],
    };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Collection not found or you do not have permission to update it.",
    );
  });

  it("Should return an error when one or more applications are not owned by the current user", async () => {
    const collection = new Collection({
      name: "My Collection",
      description: "This is my collection.",
      ownerId: user._id,
      applications: [],
    });
    await collection.save();

    const applicationOwned = new Application({
      jobTitle: "Dev",
      ownerId: user._id,
    });
    const applicationNotOwned = new Application({
      jobTitle: "Tester",
      ownerId: new mongoose.Types.ObjectId(),
    });
    await applicationOwned.save();
    await applicationNotOwned.save();

    const query = `
      mutation AddApplicationsToCollection($collectionId: ID!, $applicationIds: [ID!]!) {
        addApplicationsToCollection(collectionId: $collectionId, applicationIds: $applicationIds) {
          _id
          applications
        }
      }
    `;

    const variables = {
      collectionId: collection._id.toString(),
      applicationIds: [
        applicationOwned._id.toString(),
        applicationNotOwned._id.toString(),
      ],
    };

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query, variables });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "One or more applications are not owned by the current user.",
    );
  });
});
