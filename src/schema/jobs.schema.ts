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
  getJobs: [Job]
}
`;

export const resolvers = {
  Query: {
    getJobs: async () => {
      const jobsStreet: JobVacancy[] = await jobStreet();
      const kalibrrSource: JobVacancy[] = await kalibrr();
      console.log(kalibrrSource);

      return [...jobsStreet, ...kalibrrSource];
    },
  },
};
