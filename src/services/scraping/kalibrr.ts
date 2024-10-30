import { JobVacancy } from "../../lib/types";

export const kalibrr = async (page: number = 1) => {
  try {
    const result: JobVacancy[] = [];
    const response = await fetch(
      `https://www.kalibrr.id/kjs/job_board/search?limit=10&offset=${page * 10}`,
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
          console.log(job);
          result.push({
            title: job.name,
            company: job.company.name,
            companyLogo: job.company_info.logo,
            location: `${job.google_location?.address_components?.region}, ${job.google_location?.address_components?.city}`,
            since: job.activation_date,
            salary: job.salary || null,
            source: `https://www.kalibrr.id/c/${job.company.code}/jobs/${job.id}/human-capital-business-partner-specialist`,
            description: job.description,
          });
        },
      );
    }

    return result;
  } catch {
    return [];
  }
};
