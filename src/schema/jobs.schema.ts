import redis from "../config/redis";
import { JobVacancy } from "../lib/types";
import { jobStreet } from "../services/scraping/job-street";
import { kalibrr } from "../services/scraping/kalibrr";

export const typeDefs = `#graphql

type Job {
  title: String
  company: String
  companyLogo: String
  location: String
  description: String
  salary: String
  source: String
  since: String
}

type Query {
  getJobs(page: Int, query: String): [Job]
}
`;

export const resolvers = {
  Query: {
    getJobs: async (_, { page = 1, query }) => {
      const data = await redis.get(`jobs-${page}-${query}`);

      if (data) {
        return JSON.parse(data);
      }

      const jobsStreet: JobVacancy[] = await jobStreet({
        page,
        query,
      });
      const kalibrrSource: JobVacancy[] = await kalibrr({
        page,
        query,
      });

      await redis.set(
        `jobs-${page}-${query}`,
        JSON.stringify([...jobsStreet, ...kalibrrSource]),
      );

      await redis.expire(`jobs-${page}-${query}`, 60 * 60 * 4);

      return [...jobsStreet, ...kalibrrSource];
    },
  },
};
