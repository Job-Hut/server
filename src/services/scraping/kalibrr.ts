import * as cheerio from "cheerio";
import { JobVacancy } from "../../lib/types";

export const kalibrr = async ({
  page = 1,
  query = "",
}: {
  page?: number;
  query?: string;
}) => {
  const result: JobVacancy[] = [];
  const response = await fetch(
    `https://www.kalibrr.id/kjs/job_board/search?limit=10&offset=${page * 10}&text=${query}`,
  );

  const data: {
    jobs?: [];
  } = await response.json();

  if (data.jobs) {
    data.jobs.forEach(
      (job: {
        id: string;
        name: string;
        company: {
          name: string;
          code: string;
        };
        company_info: {
          logo: string;
        };
        google_location: {
          address_components: {
            region: string;
            city: string;
          };
        };
        activation_date: string;
        salary: string;
        description: string;
      }) => {
        result.push({
          title: job.name,
          company: job.company.name,
          companyLogo: job.company_info.logo,
          location: `${job.google_location?.address_components?.region}, ${job.google_location?.address_components?.city}`,
          since: job.activation_date,
          salary: job.salary || null,
          source: `https://www.kalibrr.id/c/${job.company.code}/jobs/${job.id}/human-capital-business-partner-specialist`,
          description: cheerio.load(job.description).text(),
        });
      },
    );
  }

  return result;
};
