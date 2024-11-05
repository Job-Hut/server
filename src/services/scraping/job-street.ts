import * as cheerio from "cheerio";
import { JobVacancy } from "../../lib/types";

export const jobStreet = async ({
  query = "",
  page = 1,
}: {
  query?: string;
  page?: number;
}): Promise<JobVacancy[]> => {
  const $ = await cheerio.fromURL(
    `https://id.jobstreet.com/id/${query ? `${query}-jobs` : `jobs`}?page=${page}`,
  );

  const jobsContainer =
    "#app > div > div:nth-child(7) > div > section > div:nth-child(2) > div > div > div > div > div > div._1ungv2r0._1viagsn4z._1viagsnr._1viagsnp._1viagsnhv._1viagsnhz._1viagsnbv._1viagsnbp._1viagsn8j._177offj0._177offj7 > div > div._1ungv2r0._21bfxf1 > div._1ungv2r0._1viagsn5b._1viagsnhf._1viagsn6n";

  const jobs = $(jobsContainer).children();

  const result = [];

  jobs.each((_, element) => {
    const job = $(element);

    const title = job.find(`a[data-automation="jobTitle"]`).text().trim();
    const company = job.find(`a[data-automation="jobCompany"]`).text().trim();
    const location = job
      .find(`span[data-automation="jobCardLocation"]`)
      .text()
      .trim();

    const since = job
      .find(`span[data-automation="jobListingDate"]`)
      .text()
      .trim();
    const description = job
      .find(`span[data-automation="jobShortDescription"]`)
      .text()
      .trim();
    const source = job
      .find(`a[data-automation="job-list-view-job-link"]`)
      .attr("href");
    const companyLogo = job.find(`img._14jhc320`).attr("src");

    if (title && company) {
      const jobData: JobVacancy = {
        title,
        company,
        companyLogo,
        location,
        since,
        salary: null,
        source: `https://id.jobstreet.com${source}`,
        description,
      };

      result.push(jobData);
    }
  });

  return result;
};
