import * as cheerio from "cheerio";
import { JobVacancy } from "../../lib/types";

export const jobStreet = async (
  query: string = null,
  page: number = 1,
): Promise<JobVacancy[]> => {
  const $ = await cheerio.fromURL(
    `https://id.jobstreet.com/id/${query ? `${query}-jobs` : `jobs`}?page=${page}`,
  );

  const jobsContainer =
    "#app > div > div:nth-child(7) > div > section > div:nth-child(2) > div > div > div > div > div > div.a3yfdf0._5xlhbl4z._5xlhblr._5xlhblp._5xlhblhv._5xlhblhz._5xlhblbv._5xlhblbp._5xlhbl8j.tawfcs0.tawfcs7 > div > div.a3yfdf0._21bfxf1 > div.a3yfdf0._5xlhbl5b._5xlhblhf._5xlhbl6n";

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
    const salary = job
      .find(
        "div.a3yfdf0._5xlhbl5b._5xlhblhf._5xlhbl6n > div:nth-child(2) > span > span",
      )
      .text()
      .trim();
    const since = job
      .find("div.a3yfdf0._5xlhbl5b._5xlhblhf._5xlhbl6v > span")
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

      if (typeof salary == "string" && salary != "") {
        jobData.salary = salary.split("–")[1];
      }

      result.push(jobData);
    }
  });

  return result;
};
