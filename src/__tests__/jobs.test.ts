import { Express } from "express";
import request from "supertest";
import { setupTestEnvironment, teardownTestEnvironment } from "./setup";

describe("GraphQL Integration Tests", () => {
  let app: Express;
  beforeAll(async () => {
    app = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it("should fetch jobs", async () => {
    const query = `
      query {
        getJobs {
          title
          company
          location
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.getJobs).toBeDefined();
  });

  it("should return cached data from Redis on subsequent requests", async () => {
    const query = `
      query {
        getJobs {
          title
          company
          location
        }
      }
    `;

    const response1 = await request(app).post("/graphql").send({ query });
    expect(response1.status).toBe(200);
    const firstResult = response1.body.data.getJobs;

    const response2 = await request(app).post("/graphql").send({ query });
    expect(response2.status).toBe(200);
    const secondResult = response2.body.data.getJobs;

    expect(secondResult).toEqual(firstResult);
  });
});
