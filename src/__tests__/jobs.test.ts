import server from "../server";
import redis from "../config/redis"; // Adjust the import path as needed
import assert from "assert";

jest.mock("../config/redis");

describe("Job Schema", () => {
  it("should return a cached list of job vacancies ", async () => {
    const mockJobs = [
      {
        title: "Software Engineer",
        company: "Tech Company",
        companyLogo: "logo.png",
        location: "San Francisco, CA",
        description: "Job description",
        salary: "$100,000",
        source: "JobStreet",
        since: "1 day ago",
      },
    ];

    (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockJobs));

    const query = `
      query Jobs {
        getJobs {
          title
          company
          companyLogo
          location
          description
          salary
          source
          since
        }
      }
    `;

    const response = await server.executeOperation({ query });

    assert(response.body.kind === "single");
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data).toBeDefined();
    expect(response.body.singleResult.data?.getJobs).toBeInstanceOf(Array);
    expect(redis.set).not.toHaveBeenCalled();
  });

  it("should fetch jobs from sources and cache them if not in Redis", async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    (redis.set as jest.Mock).mockResolvedValue("OK");

    const query = `
      query {
        getJobs {
          title
          company
          companyLogo
          location
          description
          salary
          source
          since
        }
      }
    `;
    const response = await server.executeOperation({ query });

    assert(response.body.kind === "single");
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data).toBeDefined();
    expect(response.body.singleResult.data?.getJobs).toBeInstanceOf(Array);
    expect(redis.set).toHaveBeenCalled();
  });
});
